#!/bin/bash
gem build pot.gemspec
gem install --local pot
rm pot-1.1.0.gem
