require File.join(File.dirname(__FILE__), "spec_helper")

describe 'textile' do

  before(:all) do
    @editor = find_element(:css, '#textile .markupEditor')
    @preview = @editor.find_element(:css, '.preview')
    @textarea = @editor.find_element(:css, 'textarea')
  end

  describe 'lists' do
    
    it 'should insert new * bullet on enter' do
      set("* list\\n* list");
      # TODO enter does not work as expected
      send_keys @textarea, :end, :enter, "paragraph"
    end
    
    it 'should insert new # bullet on enter' do
      
    end
    
  end
end
