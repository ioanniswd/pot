require 'rspec'
require 'json'
require_relative '../lib/pr'
require_relative '../lib/services/github_client'

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end
end

# Helper to load fixture files
def load_fixture(filename)
  path = File.join(__dir__, 'fixtures', filename)
  JSON.parse(File.read(path))
end
