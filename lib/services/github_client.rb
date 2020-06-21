require 'net/http'
require 'uri'
require 'json'
require 'date'

require_relative '../config'

class GithubClient
  # Returns an array of hashes, each hash containing information on a pr
  def self.prs
    _prs = []

    repository_names.each do |repository_name|
      has_next = true
      last_cursor = nil

      while has_next
        response = next_request(last_cursor, repository_name)
        has_next = response['pageInfo']['hasNextPage']

        _prs += response['edges']

        last_cursor = _prs.last&.dig('cursor')&.gsub(/=*$/, '')
      end
    end

    _prs
  end

  private

  def self.next_request(last_cursor, repository_name)
    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "bearer #{ENV['GAT']}"

    if last_cursor
      after = ", after: \"#{last_cursor}\""
    end

    request.body = JSON.dump({
      'query' => "query { repository(owner: \"#{owner_name}\", name: \"#{repository_name}\") { pullRequests(first: 80, states: OPEN#{after}) { pageInfo { hasNextPage } edges { cursor node { additions deletions reviews(first: 80) { edges { node { author { login } state createdAt }  } } reviewRequests(first: 80) { edges { node { requestedReviewer { ... on User { login } } } } } url title author { login } participants(first: 80) { edges { node { login } } } } } } } }"
    })

    req_options = {
      use_ssl: uri.scheme == 'https'
    }

    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
      http.request(request)
    end

    JSON.parse(response.body)['data']['repository']['pullRequests']
  end

  private

  def self.github_url
    config.github_url
  end

  def self.repository_names
    config.repository_names.gsub(' ', '').split(',')
  end

  def self.owner_name
    config.owner_name
  end

  def self.config
    @config ||= Config.new
  end

  def self.uri
    return @uri if @uri

    @uri = URI.parse(github_url)

    if @uri.scheme.nil?
      @uri = URI.parse("https://#{github_url}")
    end

    @uri = URI.join(@uri.to_s, 'api/graphql')
  end
end
