require_relative 'pr_user'

class PrUserCollection
  def self.pr_users(user_pr_counts:, loc_per_user:, options:, actionables_per_author:, untouched_per_author:, users_to_include:)

    @pr_users ||=
      user_pr_counts.map do |user, counts|
        PrUser.new(
          user: user,
          user_pr_counts: counts,
          loc: loc_per_user[user],
          actionable_count: actionables_per_author[user],
          untouched_count: untouched_per_author[user]
        )
      end +
      (users_to_include - user_pr_counts.keys).map do |user|
        PrUser.new(
          user: user,
          actionable_count: actionables_per_author[user],
          untouched_count: untouched_per_author[user]
        )
      end
  end
end
