require 'fileutils'
require 'json'

class Config
  CONFIG_FOLDER_PATH = ENV['HOME'] + '/.pot'
  CONFIG_FILE_PATH = CONFIG_FOLDER_PATH + '/config'

  def init
    if !File.exists?(CONFIG_FOLDER_PATH)
      Dir.mkdir(CONFIG_FOLDER_PATH)
    end

    print 'What is the organizations github url(e.g. github.<company>.com): '
    input = gets.strip
    @github_url = input if input.size > 0

    print 'Repository names (comma separated): '
    input = gets.strip
    @repository_names  = input if input.size > 0

    print 'Who is the owner of the repository(org name): '
    input = gets.strip
    @owner_name  = input if input.size > 0

    save_config
  end

  def github_url
    @github_url ||= config["github_url"]
  end

  def repository_names
    @repository_names ||= config["repository_names"]
  end

  def owner_name
    @owner_name ||= config["owner_name"]
  end

  private

  def save_config
    File.write(
      CONFIG_FILE_PATH,
      JSON.pretty_generate({
        github_url: github_url,
        repository_names: repository_names,
        owner_name: owner_name
      })
    )
  end

  def config
    @config ||= if File.exists?(CONFIG_FILE_PATH)
                  JSON.parse(File.read(CONFIG_FILE_PATH))
                else
                  {}
                end
  end
end
