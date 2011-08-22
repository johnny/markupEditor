#!/bin/sh

cp README.mkd ..
middleman build
git commit -am 'Update joined files'
git checkout gh-pages
rm -R javascripts/ stylesheets/
mv build/* .
mv ../README.mkd .
git commit -am 'Update pages. See main branch for changes'
git push origin gh-pages
git checkout master
