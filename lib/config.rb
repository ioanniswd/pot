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
    @github_url = gets.strip

    print 'Repository name: '
    @repository_name = gets.strip

    print 'Who is the owner of the repository(org name): '
    @owner_name = gets.strip

    save_config
  end

  def github_url
    @github_url ||= config["github_url"]
  end

  def repository_name
    @repository_name ||= config["repository_name"]
  end

  def owner_name
    @owner_name ||= config["owner_name"]
  end

  def initialized?
    File.exists?(CONFIG_FILE_PATH)
  end

  private

  def save_config
    File.write(
      CONFIG_FILE_PATH,
      JSON.pretty_generate({
        github_url: github_url,
        repository_name: repository_name,
        owner_name: owner_name
      })
    )
  end

  def config
    @config ||= JSON.parse(File.read(CONFIG_FILE_PATH))
  end
end
