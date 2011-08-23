#!/bin/sh

CURRENT=`git branch | grep '\*' | awk '{print $2}'`

cp README.mkd ..
middleman build
git commit -am 'Update joined files'
git checkout gh-pages
rm -R javascripts/ stylesheets/
mv build/* .
mv ../README.mkd .
git add .
git commit -am 'Update pages. See main branch for changes'
git push origin gh-pages
git checkout $CURRENT
