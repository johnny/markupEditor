require 'rubygems'
require "bundler/setup"
require "rspec"
require 'selenium-webdriver'

dir = File.dirname(__FILE__)
require dir + '/support/helpers'

RSpec.configure do |config|
  config.include Helpers
end
