# CodeRay syntax highlighting in Haml
# activate :code_ray

# Helpers
helpers do
  def text_field(name, options = {})
    label_tag(name, :caption => options.delete(:caption)) <<
      text_field_tag(name, options.merge(:class => name))
  end
  def textarea(name)
    File.read("source/textareas/"+ name)
  end
end

set :css_dir, 'css'

set :js_dir, 'js'

set :images_dir, 'img'

# set :views, File.dirname(__FILE__)

# Build-specific configuration
configure :build do
  filename = 'source/js/markup-editor.js'
  VERSION = File.read("VERSION").strip
  updated_file = File.read(filename).gsub(/(^\s\*.*v)[\d\.]+$/, '\1' + VERSION)
  File.open(filename, "w") do |file|
    file.puts updated_file
  end

  require 'closure-compiler'
  File.open('source/js/markup-editor-min.js','w') do |file|
    # closure = Closure::Compiler.new(:compilation_level => 'ADVANCED_OPTIMIZATIONS')
    closure = Closure::Compiler.new
    file.puts closure.compile(updated_file)
  end

  # For example, change the Compass output style for deployment
  # activate :minify_css
  
  # Minify Javascript on build
  # activate :minify_javascript
  
  # Enable cache buster
  # activate :cache_buster
  
  # Use relative URLs
  # activate :relative_assets
  
  # Compress PNGs after build (gem install middleman-smusher)
  # require "middleman-smusher"
  # activate :smusher

  # Generate ugly/obfuscated HTML from Haml
  # activate :ugly_haml
  
  # set :http_prefix, "file:///home/jonas/projects/markup_editor/build/"
  set :http_prefix, "/markup-editor"
end

if development?
  require 'rack-livereload'
  use Rack::LiveReload,
  :source => :vendored
end

require 'rack/coderay'
use Rack::Coderay, "//pre[@lang]"

# Hack to fix haml output
class Rack::Coderay::Parser
  private
  def coderay_render(text, language) #:nodoc:
    text = text.to_s.gsub(/&#x000A;/i, "\n").gsub("&lt;", '<').gsub("&gt;", '>').gsub("&amp;", '&').gsub("&quot;", '"')
    ::CodeRay.scan(text, language.to_sym).div(self.coderay_options)
  end
end

require 'lib/markup'
use Rack::Markup
