require 'net/http'
require 'uri'
require 'json'
require 'date'

require_relative '../config'

class GithubClient
  attr_reader(
    :options
  )

  def initialize(options: )
    @options = options
  end

  # Returns an array of hashes, each hash containing information on a pr
  def prs
    return cached_response if options[:cached] && cached_response

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

    write_cached_response(_prs) if config.cache_enabled?

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

  def cached_response
    cached_responses_full[cached_response_key]
  end

  def github_url
    'https://api.github.com/graphql'
  end

  def repository_names
    (options[:repository_names] || config.repository_names)&.gsub(' ', '')&.split(',')
  end

  def owner_name
    options[:owner_name] || config.owner_name
  end

  def uri
    @uri ||= URI.parse(github_url)
  end

  def write_cached_response(data)
    cached_responses_full[cached_response_key] = data

    File.write(cached_response_file_path, JSON.dump(cached_responses_full))
  end

  def cached_responses_full
    @cached_responses_full ||=
      if File.exists?(cached_response_file_path)
        JSON.parse(File.read(cached_response_file_path))
      else
        {}
      end
  end

  def cached_response_key
    @cached_response_key ||=
      repository_names.
      sort.join(', ')
  end

  def cached_response_file_path
    config.config_folder_path + '/cached_response'
  end
end
