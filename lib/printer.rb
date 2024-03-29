require 'terminal-table'
require_relative 'pr_user_collection'
require_relative 'aggregated_data'

class Printer
  attr_reader(
    :options
  )

  def initialize(options: )
    @options = options
  end

  def print
    if options[:url_only]
      if options[:user].nil?
        puts 'Option "url_only" can only be used with --user=<the_user>'
        exit(1)
      end

      print_urls
    else
      print_aggregated

      print_user_specific if options[:user]
    end
  end

  def print_urls
    if options[:actionable].nil?
      puts aggregated_data.pr_urls.map { |pr| pr[:url] }
    else
      aggregated_data.pr_urls.each do |pr|
        puts pr[:url] if pr[:actionable] == options[:actionable]
      end
    end
  end

  private

  def print_aggregated
    table = Terminal::Table.new(
      headings: [
        'User',
        'Authored',
        'Reviewing',
        'Total',
        ' Total + / - ',
        'Actionables',
        'Actionable  + / -',
        'Untouched'
      ]
    )

    pr_users.
      each do |user|
        username = user.username

        if options[:user] == user.username
          username = "-- #{username} --"
        end

        if(user_included?(user.username))
          table.add_row([
            username,
            user.authored_count,
            user.reviewing_count,
            user.total_count.to_s,
            "#{user.total_additions_loc} / #{user.total_deletions_loc}",
            user.actionable_count,
            "#{user.actionable_additions_loc} / #{user.actionable_deletions_loc}",
            user.untouched_count
          ])
        end
      end

    puts table
  end

  def print_user_specific
    if options[:user]
      print_authored_prs

      puts

      print_reviewing_prs
    end
  end

  def print_authored_prs
    table = Terminal::Table.new(
      title: 'Authored',
      headings: [
        'Actionable',
        'Approvals',
        '+/-',
        'PR'
      ]
    )

    aggregated_data.specified_user_prs[:authored].
      sort { |user_pr| user_pr[:actionable] ? 0 : 1 }.
      each do |user_pr|
        approved_to_num_of_reviewers = "#{user_pr[:num_of_approvals]} / #{user_pr[:num_of_reviewers]}"
        changes_ratio = "#{user_pr[:additions]} / #{user_pr[:deletions]}"

        table.add_row( [
          user_pr[:actionable] ? 'Yes' : 'No',
          approved_to_num_of_reviewers,
          changes_ratio,
          user_pr[:title]
        ])
      end

    puts table
  end

  def print_reviewing_prs
    table = Terminal::Table.new(
      title: 'Reviewing',
      headings: [
        'Actionable',
        'Untouched',
        'Author: Actionables',
        'Approvals',
        '+/-',
        'PR'
      ]
    )

    aggregated_data.specified_user_prs[:reviewing].
      sort(&specified_user_reviewing_prs_sorting_criteria).
      each do |user_pr|
        author_actionables = "#{user_pr[:author]}: #{aggregated_data.actionables_count_per_author[user_pr[:author]]}"
        approved_to_num_of_reviewers = "#{user_pr[:num_of_approvals]} / #{user_pr[:num_of_reviewers]}"
        changes_ratio = "#{user_pr[:additions]} / #{user_pr[:deletions]}"

        table.add_row( [
          user_pr[:actionable] ? 'Yes' : 'No',
          user_pr[:untouched] ? 'Yes' : 'No',
          author_actionables,
          approved_to_num_of_reviewers,
          changes_ratio,
          user_pr[:title]
        ])
      end

    puts table
  end

  def user_included?(user)
    users_to_include.include?(user)
  end

  def users_to_include
    return @users_to_include if @users_to_include

    users = options[:users]&.split(',') || []

    @users_to_include = users.push(options[:user]).compact
    @users_to_include.push(*aggregated_data.relevant_users_according_to_specified_user)

    @users_to_include.uniq!

    @users_to_include
  end

  def pr_users
    @pr_users ||= PrUserCollection.pr_users(
      aggregated_data: aggregated_data,
      users_to_include: users_to_include
    ).sort(&pr_users_sorting_criteria)
  end

  def pr_users_sorting_criteria
    proc do |a, b|
      [
        a.total_count,
        a.actionable_count,
        a.untouched_count
      ] <=> [
        b.total_count,
        b.actionable_count,
        b.untouched_count
      ]
    end
  end

  def specified_user_reviewing_prs_sorting_criteria
    # Putting actionable PRs first and then sorting by author actionables
    # count
    proc do |a, b|
      actionable_score_a = a[:actionable] ? 0 : 1
      actionable_score_b = b[:actionable] ? 0 : 1

      actionables_count_per_author_a = aggregated_data.actionables_count_per_author[a[:author]]
      actionables_count_per_author_b = aggregated_data.actionables_count_per_author[b[:author]]

      [actionable_score_a, actionables_count_per_author_a] <=>
      [actionable_score_b, actionables_count_per_author_b]
    end
  end

  def aggregated_data
    @aggregated_data ||= AggregatedData.new(options: options)
  end
end
