require 'net/http'
require 'uri'
require 'json'
require 'date'

require_relative '../config'

class GithubClient
  attr_reader :options

  def initialize(options:)
    @options = options
  end

  # Returns an array of hashes, each hash containing information on a pr
  def prs
    _prs = []

    if repository_names.nil? || repository_names == ''
      puts 'Attribute repository_names must be provided either through the' \
        ' config, or through an option'

      exit(1)
    end

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

  def next_request(last_cursor, repository_name)
    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "bearer #{ENV['GAT']}"

    if last_cursor
      after = ", after: \"#{last_cursor}\""
    end

    if owner_name.nil? || owner_name == ''
      puts 'Attribute owner_name must be provided either through the' \
        ' config, or through an option'

      exit(1)
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

  def github_url
    options[:github_url] || config.github_url
  end

  def repository_names
    (options[:repository_names] || config.repository_names)&.gsub(' ', '')&.split(',')
  end

  def owner_name
    options[:owner_name] || config.owner_name
  end

  def config
    @config ||= Config.new
  end

  def uri
    return @uri if @uri

    if github_url.nil? || github_url == ''
      puts 'Attribute github_url must be provided either through the config, or' \
        ' through an option'

      exit(1)
    end

    @uri = URI.parse(github_url)

    if @uri.scheme.nil?
      @uri = URI.parse("https://#{github_url}")
    end

    @uri = URI.join(@uri.to_s, 'api/graphql')
  end
end
