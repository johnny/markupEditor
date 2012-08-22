/* ===================================================
 *  markup-editor.js v0.9.2
 *  http://markup-editor.heroku.com
 * ===================================================
 *  Copyright (c) 2012 Jonas von Andrian
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *  * The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *  DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 *  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 *  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 *  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ========================================================== */

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
