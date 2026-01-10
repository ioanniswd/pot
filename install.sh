#!/bin/bash
gem build pot.gemspec
gem install --local pot --user-install
rm pot-2.0.0.gem
