module Helpers
  include Selenium
  
  def driver
    @driver ||= get_driver
  end

  def find_element(*args)
    driver.find_element(*args)
  end

  def set(string)
    jsString = "textile.set('%s');" % string;
    driver.execute_script(jsString);
  end

  def send_keys(element, *keys)
    keys.each do |key|
      element.send_keys key
      # jsString = "fireEvent.apply(this, arguments)"
      # driver.execute_script(jsString, element, 'click')
    end
  end

  private

  def get_driver
    profile = WebDriver::Firefox::Profile.from_name "selenium"
    # not supported on Linux with awesome
    # profile.native_events = true

    driver = WebDriver.for :firefox, :profile => profile
    driver.navigate.to "http://localhost:4567/selenium.html"
    driver
  end
end
