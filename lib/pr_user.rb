class PrUser
  attr_reader(
    :username,
    :user_pr_counts,
    :actionable_count,
    :untouched_count,
    :loc
  )

  def initialize(user:, user_pr_counts: nil, loc: nil, actionable_count:, untouched_count:)
    @username = user
    @user_pr_counts = user_pr_counts
    @actionable_count = actionable_count
    @untouched_count = untouched_count
    @loc = loc
  end

  def authored_count
    return 0 if user_pr_counts.nil?

    user_pr_counts[:author]
  end

  def reviewing_count
    return 0 if user_pr_counts.nil?

    user_pr_counts[:active_reviewer]
  end

  def total_count
    authored_count + reviewing_count
  end

  def total_additions_loc
    total_loc[:additions]
  end

  def total_deletions_loc
    total_loc[:deletions]
  end

  def actionable_additions_loc
    actionable_loc[:additions]
  end

  def actionable_deletions_loc
    actionable_loc[:deletions]
  end

  private

  def total_loc
    return Hash.new { 0 } if loc.nil?

    loc[:total]
  end

  def actionable_loc
    return Hash.new { 0 } if loc.nil?

    loc[:actionable]
  end
end
