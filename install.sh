#!/bin/bash
gem build pot.gemspec
gem install --local pot
rm pot-1.2.1.gem
