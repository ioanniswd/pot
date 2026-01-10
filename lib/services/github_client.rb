require 'json'
require 'date'
require 'open3'

require_relative '../config'

class GithubClient
  attr_reader(
    :options
  )

  def initialize(options: )
    @options = options
    check_gh_installed
  end

  # Returns an array of hashes from gh pr list, each hash containing PR data
  # Format: [{ title, url, author, additions, deletions, reviews, reviewRequests, ... }, ...]
  def prs
    return cached_response if options[:cached] && cached_response

    _prs = []

    if repository_names.nil? || repository_names == ''
      puts 'Attribute repository_names must be provided either through the' \
        ' config, or through an option'

      exit(1)
    end

    repository_names.each do |repository_name|
      gh_prs = fetch_prs_from_gh(repository_name)
      _prs += gh_prs
    end

    write_cached_response(_prs) if config.cache_enabled?

    _prs
  end

  private

  def check_gh_installed
    unless system('gh --version > /dev/null 2>&1')
      puts <<~ERROR
        ❌ Error: GitHub CLI (gh) is not installed or not accessible.

        pot now requires the GitHub CLI to function properly. This improves
        reliability and provides better error handling.

        Please install GitHub CLI from: https://cli.github.com

        After installation, you'll need to authenticate:
          gh auth login

        Then you can use pot as usual:
          pot --users=john,jane --user=john
      ERROR
      exit(1)
    end
  end

  def fetch_prs_from_gh(repository_name)
    if owner_name.nil? || owner_name == ''
      puts 'Attribute owner_name must be provided either through the' \
        ' config, or through an option'

      exit(1)
    end

    repo = "#{owner_name}/#{repository_name}"

    # Specify all JSON fields we need, including nested review/reviewRequest data
    json_fields = 'number,title,url,author,additions,deletions,reviews,reviewRequests'

    cmd = "gh pr list --repo #{repo} --state open --json #{json_fields} --limit 100"

    stdout, stderr, status = Open3.capture3(cmd)

    unless status.success?
      puts "Error fetching PRs for #{repo}:"
      puts stderr
      exit(1)
    end

    JSON.parse(stdout)
  rescue JSON::ParserError => e
    puts "Error parsing gh output for #{repo}: #{e.message}"
    exit(1)
  end

  def cached_response
    cached_responses_full[cached_response_key]
  end

  def repository_names
    (options[:repository_names] || config.repository_names)&.gsub(' ', '')&.split(',')
  end

  def owner_name
    options[:owner_name] || config.owner_name
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
