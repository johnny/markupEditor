require 'haml'
require 'haml/html'

module Rack
  class Markup

    def initialize(app, options={})
      @app = app
    end

    def call(env)
      if env["REQUEST_PATH"] == "/api/markup/to_html"
        # [404,{'Content-Type' => 'text/plain'},'not found']
        call_method('_to_html', env)
      elsif env["REQUEST_PATH"] == "/api/markup/from_html"
        call_method('_from_html', env)
      elsif env["REQUEST_PATH"] == "/api/markup/get"
        render_file(env)
      else
        @app.call(env)
      end
    end

    protected

    def render_file(env)
      file = ::Rack::Request.new(env).params['file']
      text = ::File.open(::File.join(Dir.pwd, 'source/textareas', file)).read
      [200,{'Content-Type' => 'text/plain'}, text]
    rescue => e
      p e, e.message
      [500,{'Content-Type' => 'text/plain'},'no valid markup type']
    end
    
    def call_method(method_part, env)
      params = ::Rack::Request.new(env).params
      return_string = self.send(params['type'] + method_part, params['content'])
      [200,{'Content-Type' => 'text/plain'}, return_string]
    rescue => e
      p e, e.message, params['content']
      [500,{'Content-Type' => 'text/plain'},'no valid markup type']
    end

    def haml_to_html(string)
      Haml::Engine.new(string, :ugly => true).render
    end

    def haml_from_html(string)
      Haml::HTML.new(string).render
    end

  end
end
