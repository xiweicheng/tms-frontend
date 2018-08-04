#!/bin/bash

echo "build start"

DEST=/Users/xiweicheng/tms/src/main/resources/static
SRC=/Users/xiweicheng/tms-frontend

echo "DEST DIR: $DEST"
echo "SRC DIR: $SRC"

echo "au pkg --env prod"

cd $SRC
au pkg --env prod

echo "rm page/scripts & page/index.html & page/blog.html"

rm -rf $DEST/page/scripts
rm -rf $DEST/page/index.html
rm -rf $DEST/page/blog.html
rm -rf $DEST/page/alert.mp3
rm -rf $DEST/page/alert.ogg

echo "cp tms-frontend to tms"

cp -rf $SRC/scripts $DEST/page
cp -rf $SRC/index.html $DEST/page
cp -rf $SRC/blog.html $DEST/page
cp -rf alert.mp3 $DEST/page
cp -rf alert.ogg $DEST/page

echo "build end"