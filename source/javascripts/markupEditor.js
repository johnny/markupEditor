(function ($) {
  var availableModes = {};

  /**
   * @namespace Holds all public methods
   */
  ME = {
    /**
     * Add a mode
     *
     * @param {String} modeId The id of the mode as referenced
     * internally
     * @param {Object} modeDefinition Defines methods and toolbaritems
     * of the new Mode
     * @param {Boolean} [isGenerated] True if the mode has been added
     * on the fly
     */
    addMode: function(modeId, modeDefinition, isGenerated) {
      modeDefinition.id = modeId;
      
      modeDefinition.supportedItems = ME.Toolbar.getSupportedItems(
        modeId,
        modeDefinition.name,
        modeDefinition.items );

      return availableModes[modeId] = new ME.Mode(modeDefinition);
    },
    hasMode: function(modeId){
      return !!availableModes[modeId];
    },
    /**
     * Get the specified mode. Loads it if necessary
     *
     * @param {String} modeId The id of the mode (e.g. textile)
     *
     * @returns {Mode} The initialized mode
     */
    getMode: function(modeId) {
      var mode = availableModes[modeId];
      if (mode) {
        return mode;
      }
      else {
        console.log("Mode " + modeId + " is not defined, adding it");
        return this.addMode(modeId, {
          name: modeId
        }, true)
      }
    },
    /**
     * The global options of markup editor
     *
     * @class
     * @property {Function} save The save callback. Takes the editor
     * as parameter
     * @property {Boolean} closable If true, the close button is
     * visible
     * @property {jQuery} preview The preview the editor has been
     * loaded from
     */
    options: {},
    /**
     * Set the options
     *
     * @see ME#options for settable options
     *
     * @param {Object} options The options object
     */
    setOptions: function(options){
      this.options = options;
    }
  };
}(jQuery));
