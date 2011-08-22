#!/bin/bash

export JSDOCDIR=~/apps/jsdoc-toolkit

rm -R source/doc/

#jsrun.sh -t=$JSDOCDIR/templates/jsdoc -d=source/doc/ \
#    source/javascripts/modes/ source/javascripts/plugins/ source/javascripts/markupEditor.js source/javascripts/util.js source/javascripts/dialog.js
jsrun.sh -p -t=template/codeview/ -d=source/doc/ \
    source/javascripts/modes/ source/javascripts/plugins/ source/javascripts/markupEditor.js source/javascripts/util.js source/javascripts/dialog.js
