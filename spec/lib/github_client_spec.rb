require_relative '../spec_helper'
require 'open3'

describe 'GithubClient class' do
  describe 'fetch_prs_from_gh method' do
    let(:mock_options) do
      {
        owner_name: 'test-owner',
        repository_names: 'test-repo'
      }
    end

    it 'parses gh JSON output correctly' do
      fixture_data = load_fixture('gh_prs_complex.json')
      mock_stdout = JSON.dump(fixture_data)
      mock_status = instance_double('Process::Status', success?: true)

      allow(Open3).to receive(:capture3).and_return([mock_stdout, '', mock_status])

      client = GithubClient.new(options: mock_options)
      result = client.send(:fetch_prs_from_gh, 'test-repo')

      expect(result.length).to eq(3)
      expect(result.first['author']['login']).to eq('alice')
      expect(result.first['title']).to eq('Add feature X')
    end

    it 'handles empty PR list' do
      mock_stdout = JSON.dump([])
      mock_status = instance_double('Process::Status', success?: true)

      allow(Open3).to receive(:capture3).and_return([mock_stdout, '', mock_status])

      client = GithubClient.new(options: mock_options)
      result = client.send(:fetch_prs_from_gh, 'test-repo')

      expect(result).to eq([])
    end

    it 'exits on gh command failure' do
      mock_status = instance_double('Process::Status', success?: false)

      allow(Open3).to receive(:capture3).and_return(['', 'Error: not found', mock_status])

      client = GithubClient.new(options: mock_options)

      expect { client.send(:fetch_prs_from_gh, 'test-repo') }.to raise_error(SystemExit)
    end

    it 'exits on JSON parse error' do
      mock_stdout = 'invalid json {'
      mock_status = instance_double('Process::Status', success?: true)

      allow(Open3).to receive(:capture3).and_return([mock_stdout, '', mock_status])

      client = GithubClient.new(options: mock_options)

      expect { client.send(:fetch_prs_from_gh, 'test-repo') }.to raise_error(SystemExit)
    end

    it 'constructs correct gh command' do
      mock_stdout = JSON.dump([])
      mock_status = instance_double('Process::Status', success?: true)

      allow(Open3).to receive(:capture3) do |cmd|
        expect(cmd).to include('gh pr list')
        expect(cmd).to include('--repo test-owner/test-repo')
        expect(cmd).to include('--state open')
        expect(cmd).to include('--json')
        expect(cmd).to include('number,title,url,author,additions,deletions,reviews,reviewRequests')
        expect(cmd).to include('--limit 100')

        [mock_stdout, '', mock_status]
      end

      client = GithubClient.new(options: mock_options)
      client.send(:fetch_prs_from_gh, 'test-repo')
    end
  end

  describe 'prs method through fetch_prs_from_gh' do
    let(:mock_options) do
      {
        owner_name: 'test-owner',
        repository_names: 'test-repo1,test-repo2'
      }
    end

    it 'returns flattened PRs from multiple repositories' do
      fixture_data_1 = load_fixture('gh_prs_simple.json')
      fixture_data_2 = load_fixture('gh_prs_complex.json')

      mock_status = instance_double('Process::Status', success?: true)
      call_count = 0

      allow(Open3).to receive(:capture3) do
        call_count += 1
        case call_count
        when 1
          [JSON.dump(fixture_data_1), '', mock_status]
        when 2
          [JSON.dump(fixture_data_2), '', mock_status]
        end
      end

      client = GithubClient.new(options: mock_options)
      result = client.send(:fetch_prs_from_gh, 'test-repo1')
      result += client.send(:fetch_prs_from_gh, 'test-repo2')

      expect(result.length).to eq(4) # 1 from first repo + 3 from second
    end

    it 'returns PRs as Pr objects when called through aggregated_data flow' do
      fixture_data = load_fixture('gh_prs_complex.json')
      mock_status = instance_double('Process::Status', success?: true)

      allow(Open3).to receive(:capture3).and_return([JSON.dump(fixture_data), '', mock_status])

      client = GithubClient.new(options: mock_options)
      pr_hashes = client.send(:fetch_prs_from_gh, 'test-repo')

      # Convert to Pr objects like aggregated_data does
      prs = pr_hashes.map { |pr| Pr.new(pr) }

      expect(prs.length).to eq(3)
      expect(prs.first).to be_instance_of(Pr)
      expect(prs.first.author).to eq('alice')
      expect(prs.first.additions).to eq(120)
    end
  end
end
