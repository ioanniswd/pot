class Pr
  attr_reader :hash

  def initialize(hash)
    @hash = hash['node']
  end

  def author
    hash['author']['login']
  end

  def active_reviewers
    (requested_reviewers + reviewers).uniq
  end

  def title
    hash['title']
  end

  def url
    hash['url']
  end

  def reviewer_actionable?(user:)
    requested_reviewers.include?(user)
  end

  def author_actionable?
    # If a reviewer is not listed as a requested reviewer, that means they have
    # placed their review and are now awaiting the author to act on it
    @author_actionable ||=
      reviewers.any? { |reviewer| !requested_reviewers.include?(reviewer) } ||
      (reviewers + requested_reviewers).empty?
  end

  def requested_reviewers
    @requested_reviewers ||=
      hash['reviewRequests']['edges'].map do |review|
        review['node']['requestedReviewer']['login']
      end
  end

  def untouched_by(user)
    !all_past_reviewers.include?(user)
  end

  def num_of_approvals
    approved_reviewers.size
  end

  def num_of_reviewers
    (all_past_reviewers + requested_reviewers).uniq.size
  end

  private

  def reviewers
    reviewers = reviews.
      group_by { |review| review[:author] }.
      map { |reviewer, reviews| latest_review(reviewer, reviews)}.
      select { |review| review[:state] == 'CHANGES_REQUESTED' }.
      map { |review| review[:reviewer] }.
      reject { |reviewer| reviewer == author }
  end

  def latest_review(reviewer, reviews)
    reviews = reviews.sort_by { |review| review[:created_at] }.reverse

    accepted_review_index = reviews.find_index { |review| review[:state] == 'APPROVED' }

    accepted_review_index.nil? ? search_limit = -1 : search_limit = accepted_review_index

    last_changed_requested_review = reviews[0..search_limit].find do |review|
      review[:state] == 'CHANGES_REQUESTED'
    end

    review_state = if !last_changed_requested_review.nil?
                     'CHANGES_REQUESTED'
                   elsif !accepted_review_index.nil?
                     'APPROVED'
                   else
                     'COMMENTED'
                   end

    {
      reviewer: reviewer,
      state: review_state
    }
  end

  def reviews
    reviews = hash['reviews']['edges'].map do |review|
      {
        author: review['node']['author']['login'],
        state: review['node']['state'],
        created_at: Date.strptime(review['node']['createdAt'], '%Y-%m-%d')
      }
    end
  end

  def all_past_reviewers
    reviewers = reviews.
      map { |review| review[:author] }.
      uniq
  end

  def approved_reviewers
    @approved_reviewers ||= reviews.
      group_by { |review| review[:author] }.
      map { |reviewer, reviews| latest_review(reviewer, reviews)}.
      select { |review| review[:state] == 'APPROVED' }.
      map { |review| review[:reviewer] }.
      reject { |reviewer| reviewer == author }
  end
end
