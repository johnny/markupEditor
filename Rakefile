require 'rubygems'
require 'rspec/core/rake_task'

desc "Run specs, run a specific spec with"
task :spec => [ "spec:default" ]

SPEC_OPTS = ["--options", "./selenium/spec.opts"]

namespace :spec do
  RSpec::Core::RakeTask.new('default') do |t|
    t.rspec_opts = SPEC_OPTS
    t.pattern = 'selenium/*_spec.rb'
  end
end
