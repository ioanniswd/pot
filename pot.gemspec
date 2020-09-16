# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'pot/version'

Gem::Specification.new do |spec|
  spec.name          = "pot"
  spec.version       = "1.1.1"
  spec.authors       = ["Giannis Poulis"]
  spec.email         = ["ioanniswd@gmail.com"]

  spec.summary       = %q{A tool to get an overview of current PRs to better distribute load amongst devs}
  spec.description   = %q{`pot` creates accumulated data for users concerning one repository, using github's graphql api}
  spec.homepage      = "https://github.com/ioanniswd/pot"
  spec.license       = "MIT"

  # Prevent pushing this gem to RubyGems.org. To allow pushes either set the 'allowed_push_host'
  # to allow pushing to a single host or delete this section to allow pushing to any host.
  if spec.respond_to?(:metadata)
    spec.metadata['allowed_push_host'] = "TODO: Set to 'http://mygemserver.com'"
  else
    raise "RubyGems 2.0 or newer is required to protect against " \
      "public gem pushes."
  end

  spec.files         = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.13"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_development_dependency "terminal-table", "~> 1.8"
  spec.executables << 'pot'
end
