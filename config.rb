# CodeRay syntax highlighting in Haml
# activate :code_ray

# Helpers
helpers do
  def text_field(name, options = {})
    label_tag(name, :caption => options.delete(:caption)) <<
      text_field_tag(name, options.merge(:class => name))
  end
end

with_layout :devLayout do
  page "/test.html"
  page "/dev.html"
end

# Change the JS directory
# set :js_dir, "scripts"

# Change the images directory
# set :images_dir, "alternative_image_directory"

# set :views, File.dirname(__FILE__)

# Build-specific configuration
configure :build do

  `./join`
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
end
