class PrUser
  attr_reader(
    :username,
    :user_pr_counts,
    :actionable_count,
    :untouched_count
  )

  def initialize(user:, user_pr_counts:, actionable_count:, untouched_count:)
    @username = user
    @user_pr_counts = user_pr_counts
    @actionable_count = actionable_count
    @untouched_count = untouched_count
  end

  def authored_count
    user_pr_counts[:author]
  end

  def reviewing_count
    user_pr_counts[:active_reviewer]
  end

  def total_count
    authored_count + reviewing_count
  end
end
