require_relative 'pr_user'

class PrUserCollection
  def self.pr_users(user_pr_counts:, options:, actionables_per_author:, untouched_per_author:)
    @pr_users ||= user_pr_counts.map do |user, counts|
      PrUser.new(
        user: user,
        user_pr_counts: counts,
        actionable_count: actionables_per_author[user],
        untouched_count: untouched_per_author[user]
      )
    end
  end
end
