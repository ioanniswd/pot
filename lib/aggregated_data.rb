require_relative 'services/github_client.rb'
require_relative 'pr'

class AggregatedData
  attr_reader(
    :options,
    :user,
    :url_only,
    :user_pr_counts
  )

  # Array<Pr> prs
  def initialize(options: )
    @options = options
    @user = options[:user]
    @url_only = options[:url_only]

    populate
  end

  def loc_per_user
    @loc_per_user ||= Hash.new do |hash, key|
      hash[key] =
        {
          total: {
            additions: 0,
            deletions: 0
          },
          actionable: {
            additions: 0,
            deletions: 0
          }
        }
    end
  end

  def untouched_count_per_author
    @untouched_count_per_author ||= Hash.new { 0 }
  end

  def pr_urls
    @pr_urls ||= []
  end

  def specified_user_prs
    @specified_user_prs ||= { authored: [], reviewing: [] }
  end

  def actionables_count_per_author
    @actionables_count_per_author ||= Hash.new { 0 }
  end

  def relevant_users_according_to_specified_user
    @relevant_users_according_to_specified_user ||= []
  end

  private

  def populate
    @user_pr_counts = Hash.new { |hash, key| hash[key] = { author: 0, active_reviewer: 0 } }

    prs.each do |pr|
      actionable = nil

      if pr.author == user
        actionable = pr.author_actionable?
        add_to_specified_user_prs(pr, actionable, :authored)
        relevant_users_according_to_specified_user.push(*pr.active_reviewers)
      end

      if pr.active_reviewers.include?(user)
        actionable = pr.reviewer_actionable?(user: user)
        add_to_specified_user_prs(pr, actionable, :reviewing)
        relevant_users_according_to_specified_user.push(pr.author)
      end

      # Increment actionable counts
      if pr.author_actionable?
        actionables_count_per_author[pr.author] += 1
      end

      add_loc_for_author(pr)

      pr.requested_reviewers.each do |requested_reviewer|
        actionables_count_per_author[requested_reviewer] += 1

        if pr.untouched_by(requested_reviewer)
          untouched_count_per_author[requested_reviewer] += 1
        end

        add_loc_for_requested_reviewer(pr, requested_reviewer)
      end
      ##

      if url_only &&
          (pr.active_reviewers.include?(user) || pr.author == user)
        pr_urls << { url: pr.url, actionable: actionable }
      end

      @user_pr_counts[pr.author][:author] += 1

      pr.active_reviewers.each do |active_reviewer|
        @user_pr_counts[active_reviewer][:active_reviewer] += 1

        add_loc_for_active_reviewer(pr, active_reviewer)
      end
    end
  end

  def add_to_specified_user_prs(pr, actionable, type)
    case type
    when :authored
      specified_user_prs[:authored] << {
        title: "#{pr.title} (#{pr.url})",
        actionable: actionable,
        num_of_approvals: pr.num_of_approvals,
        num_of_reviewers: pr.num_of_reviewers,
        additions: pr.additions,
        deletions: pr.deletions
      }
    when :reviewing
      specified_user_prs[:reviewing] << {
        title: "#{pr.title} (#{pr.url})",
        actionable: actionable,
        author: pr.author,
        untouched: pr.untouched_by(user),
        num_of_approvals: pr.num_of_approvals,
        num_of_reviewers: pr.num_of_reviewers,
        additions: pr.additions,
        deletions: pr.deletions
      }
    else
      raise 'Unknown pr type'
    end
  end

  def add_loc_for_author(pr)
    if pr.author_actionable?
      loc_per_user[pr.author][:actionable][:additions] += pr.additions
      loc_per_user[pr.author][:actionable][:deletions] += pr.deletions
    end

    loc_per_user[pr.author][:total][:additions] += pr.additions
    loc_per_user[pr.author][:total][:deletions] += pr.deletions
  end

  def add_loc_for_requested_reviewer(pr, requested_reviewer)
    loc_per_user[requested_reviewer][:actionable][:additions] += pr.additions
    loc_per_user[requested_reviewer][:actionable][:deletions] += pr.deletions
  end

  def add_loc_for_active_reviewer(pr, active_reviewer)
    loc_per_user[active_reviewer][:total][:additions] += pr.additions
    loc_per_user[active_reviewer][:total][:deletions] += pr.deletions
  end

  def prs
    @prs ||= github_client.prs.map { |pr| Pr.new(pr) }
  end

  def github_client
    GithubClient.new(options: options)
  end
end
