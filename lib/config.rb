require 'fileutils'
require 'json'

class Config
  CONFIG_FOLDER_PATH = ENV['HOME'] + '/.pot'
  CONFIG_FILE_PATH = CONFIG_FOLDER_PATH + '/config'

  attr_accessor :options

  def initialize(options:)
    @options = options
  end

  def init
    if !File.exists?(CONFIG_FOLDER_PATH)
      Dir.mkdir(CONFIG_FOLDER_PATH)
    end

    print 'Repository names (comma separated): '
    input = gets.strip
    @repository_names  = input if input.size > 0

    print 'Who is the owner of the repository(org name): '
    input = gets.strip
    @owner_name  = input if input.size > 0

    print 'Would you like to cache data to speed up subsequent requests (with --cached) (y/n): '
    input = gets.strip
    @cache_enabled = input.downcase[0] == 'y' if input.size > 0

    save_config
  end

  def repository_names
    @repository_names ||= config["repository_names"]
  end

  def owner_name
    @owner_name ||= config["owner_name"]
  end

  def register_new(register_name)
    all_registered_configs[register_name] = {}

    options.keys.each do |key|
      next if [:register_new, :registered_name, :registered, :cached].include?(key)

      all_registered_configs[register_name][key.to_s] = options[key]
    end

    save_config
  end

  def registered_config(register_name)
    all_registered_configs[register_name]
  end

  def cache_enabled?
    return @cache_enabled if !@cache_enabled.nil?

    @cache_enabled = !!config['cache_enabled']
  end

  def config_folder_path
    CONFIG_FOLDER_PATH
  end

  private

  def save_config
    File.write(
      CONFIG_FILE_PATH,
      JSON.pretty_generate({
        repository_names: repository_names,
        owner_name: owner_name,
        cache_enabled: cache_enabled?,
        registered: all_registered_configs
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

  def all_registered_configs
    @all_registered_configs ||= config['registered'] || {}
  end
end
