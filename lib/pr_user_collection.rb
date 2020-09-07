require_relative 'pr_user'

class PrUserCollection
  def self.pr_users(aggregated_data:, users_to_include: )

    @pr_users ||=
      aggregated_data.user_pr_counts.map do |user, counts|
        PrUser.new(
          user: user,
          user_pr_counts: counts,
          loc: aggregated_data.loc_per_user[user],
          actionable_count: aggregated_data.actionables_count_per_author[user],
          untouched_count: aggregated_data.untouched_count_per_author[user]
        )
      end +
      (users_to_include - aggregated_data.user_pr_counts.keys).map do |user|
        PrUser.new(
          user: user,
          actionable_count: aggregated_data.actionables_count_per_author[user],
          untouched_count: aggregated_data.untouched_count_per_author[user]
        )
      end
  end
end
