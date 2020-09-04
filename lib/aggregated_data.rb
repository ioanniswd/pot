class AggregatedData
  attr_reader(
    :prs,
    :user,
    :url_only,
    :user_pr_counts
  )

  # Array<Pr> prs
  def initialize(prs:, user:, url_only: )
    @prs = prs
    @user = user
    @url_only = url_only

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

  def untouched_per_author
    @untouched_per_author ||= Hash.new { 0 }
  end

  def pr_urls
    @pr_urls ||= []
  end

  def user_prs
    @user_prs ||= { authored: [], reviewing: [] }
  end

  def actionables_per_author
    @actionables_per_author ||= Hash.new { 0 }
  end

  private

  def populate
    @user_pr_counts = Hash.new { |hash, key| hash[key] = { author: 0, active_reviewer: 0 } }

    prs.each do |pr|
      actionable = nil

      if pr.author == user
        actionable = pr.author_actionable?
        user_prs[:authored] << {
          title: "#{pr.title} (#{pr.url})",
          actionable: actionable,
          num_of_approvals: pr.num_of_approvals,
          num_of_reviewers: pr.num_of_reviewers,
          additions: pr.additions,
          deletions: pr.deletions
        }
      end

      if pr.active_reviewers.include?(user)
        actionable = pr.reviewer_actionable?(user: user)
        user_prs[:reviewing] << {
          title: "#{pr.title} (#{pr.url})",
          actionable: actionable,
          author: pr.author,
          untouched: pr.untouched_by(user),
          num_of_approvals: pr.num_of_approvals,
          num_of_reviewers: pr.num_of_reviewers,
          additions: pr.additions,
          deletions: pr.deletions
        }
      end

      # Increment actionable counts
      if pr.author_actionable?
        actionables_per_author[pr.author] += 1

        loc_per_user[pr.author][:actionable][:additions] += pr.additions
        loc_per_user[pr.author][:actionable][:deletions] += pr.deletions
      end

      loc_per_user[pr.author][:total][:additions] += pr.additions
      loc_per_user[pr.author][:total][:deletions] += pr.deletions

      pr.requested_reviewers.each do |requested_reviewer|
        actionables_per_author[requested_reviewer] += 1

        if pr.untouched_by(requested_reviewer)
          untouched_per_author[requested_reviewer] += 1
        end

        loc_per_user[requested_reviewer][:actionable][:additions] += pr.additions
        loc_per_user[requested_reviewer][:actionable][:deletions] += pr.deletions
      end
      ##

      if url_only &&
          (pr.active_reviewers.include?(user) || pr.author == user)
        pr_urls << { url: pr.url, actionable: actionable }
      end

      @user_pr_counts[pr.author][:author] += 1

      pr.active_reviewers.each do |active_reviewer|
        @user_pr_counts[active_reviewer][:active_reviewer] += 1

        loc_per_user[active_reviewer][:total][:additions] += pr.additions
        loc_per_user[active_reviewer][:total][:deletions] += pr.deletions
      end
    end
  end
end
