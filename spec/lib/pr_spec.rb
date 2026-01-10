require_relative '../spec_helper'

describe 'Pr class' do
  describe 'requested_review_open_pr' do
    let(:pr_data) { load_fixture('requested_review_open_pr.json').first }
    let(:pr) { Pr.new(pr_data) }

    it 'returns correct author' do
      expect(pr.author).to eq('ioanniswd')
    end

    it 'has review request with no reviews' do
      expect(pr.requested_reviewers).to eq(['ioanniswd-bot'])
    end

    it 'active_reviewers includes requested reviewer' do
      expect(pr.active_reviewers).to eq(['ioanniswd-bot'])
    end

    it 'reviewer is actionable (in review request)' do
      expect(pr.reviewer_actionable?(user: 'ioanniswd-bot')).to be_truthy
    end

    it 'author is not actionable (waiting for review)' do
      expect(pr.author_actionable?).to be_falsy
    end
  end

  describe 'requested_changes_first_time' do
    let(:pr_data) { load_fixture('requested_changes_first_time.json').first }
    let(:pr) { Pr.new(pr_data) }

    it 'has no review requests' do
      expect(pr.requested_reviewers).to eq([])
    end

    it 'reviewer has requested changes in active reviewers' do
      expect(pr.active_reviewers).to eq(['ioanniswd-bot'])
    end

    it 'reviewer is not actionable (not in request list)' do
      expect(pr.reviewer_actionable?(user: 'ioanniswd-bot')).to be_falsy
    end

    it 'author is actionable (changes requested)' do
      expect(pr.author_actionable?).to be_truthy
    end

    it 'tracks untouched reviewers correctly' do
      expect(pr.untouched_by('ioanniswd-bot')).to be_falsy
    end
  end

  describe 're_requesting_review_after_requested_changes' do
    let(:pr_data) { load_fixture('re_requesting_review_after_requested_changes.json').first }
    let(:pr) { Pr.new(pr_data) }

    it 'has review request after CHANGES_REQUESTED review' do
      expect(pr.requested_reviewers).to eq(['ioanniswd-bot'])
    end

    it 'active_reviewers includes re-requested reviewer' do
      expect(pr.active_reviewers).to eq(['ioanniswd-bot'])
    end

    it 'reviewer is actionable (re-requested for review)' do
      expect(pr.reviewer_actionable?(user: 'ioanniswd-bot')).to be_truthy
    end

    it 'author is not actionable (awaiting re-review)' do
      expect(pr.author_actionable?).to be_falsy
    end
  end

  describe 're_requesting_changes_after_re_requesting_review' do
    let(:pr_data) { load_fixture('re_requesting_changes_after_re_requesting_review.json').first }
    let(:pr) { Pr.new(pr_data) }

    it 'has no review requests' do
      expect(pr.requested_reviewers).to eq([])
    end

    it 'latest review is CHANGES_REQUESTED in active reviewers' do
      # CHANGES_REQUESTED → CHANGES_REQUESTED (re-requested)
      expect(pr.active_reviewers).to eq(['ioanniswd-bot'])
    end

    it 'reviewer is not actionable (not in request, just reviewed)' do
      expect(pr.reviewer_actionable?(user: 'ioanniswd-bot')).to be_falsy
    end

    it 'author is actionable (changes requested again)' do
      expect(pr.author_actionable?).to be_truthy
    end
  end

  describe 'approved_after_requested_changes' do
    let(:pr_data) { load_fixture('approved_after_requested_changes.json').first }
    let(:pr) { Pr.new(pr_data) }

    it 'has no review requests (already approved)' do
      # CHANGES_REQUESTED → CHANGES_REQUESTED → APPROVED
      expect(pr.requested_reviewers).to eq([])
    end

    it 'has no active reviewers (latest review state is APPROVED)' do
      expect(pr.active_reviewers).to eq([])
    end

    it 'author is actionable (approved)' do
      expect(pr.author_actionable?).to be_truthy
    end

    it 'has one approval' do
      expect(pr.num_of_approvals).to eq(1)
    end

    it 'has one reviewer' do
      expect(pr.num_of_reviewers).to eq(1)
    end
  end

  describe 're_request_review_after_approval' do
    let(:pr_data) { load_fixture('re_request_review_after_approval.json').first }
    let(:pr) { Pr.new(pr_data) }

    it 'has review request after APPROVED review' do
      expect(pr.requested_reviewers).to eq(['ioanniswd-bot'])
    end

    it 'active_reviewers includes re-requested reviewer' do
      expect(pr.active_reviewers).to eq(['ioanniswd-bot'])
    end

    it 'reviewer is actionable (re-requested despite approval)' do
      expect(pr.reviewer_actionable?(user: 'ioanniswd-bot')).to be_truthy
    end

    it 'author is not actionable (awaiting re-review)' do
      expect(pr.author_actionable?).to be_falsy
    end

    it 'has no approvals' do
      expect(pr.num_of_approvals).to eq(0)
    end
  end

  describe 'approval_after_review_request_after_approval' do
    let(:pr_data) { load_fixture('approval_after_review_request_after_approval.json').first }
    let(:pr) { Pr.new(pr_data) }

    it 'has no review requests' do
      expect(pr.requested_reviewers).to eq([])
    end

    it 'has no active reviewers (latest review state is APPROVED)' do
      expect(pr.active_reviewers).to eq([])
    end

    it 'reviewer is not actionable' do
      expect(pr.reviewer_actionable?(user: 'ioanniswd-bot')).to be_falsy
    end

    it 'author is actionable (approved)' do
      expect(pr.author_actionable?).to be_truthy
    end

    it 'has one approval (same user, multiple approval reviews)' do
      expect(pr.num_of_approvals).to eq(1)
    end

    it 'has one reviewer (same person, multiple reviews)' do
      expect(pr.num_of_reviewers).to eq(1)
    end
  end

  describe 'edge cases' do
    it 'handles PR with nil reviews gracefully' do
      pr_data = {
        'number' => 100,
        'title' => 'Test',
        'url' => 'http://example.com',
        'author' => { 'login' => 'test' },
        'additions' => 10,
        'deletions' => 5,
        'reviews' => nil,
        'reviewRequests' => nil
      }
      pr = Pr.new(pr_data)
      expect(pr.requested_reviewers).to eq([])
      expect(pr.active_reviewers).to eq([])
    end
  end
end
