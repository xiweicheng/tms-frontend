#!/bin/bash

echo "build start"

DEST=/Users/xiweicheng/tms/src/main/resources/static
SRC=/Users/xiweicheng/tms-frontend

echo "DEST DIR: $DEST"
echo "SRC DIR: $SRC"

echo "au pkg --env prod"

cd $SRC
au pkg --env prod

echo "rm page/scripts & page/index.html"

rm -rf $DEST/page/scripts
rm -rf $DEST/page/index.html

echo "cp tms-frontend to tms"

cp -rf $SRC/scripts $DEST/page
cp -rf $SRC/index.html $DEST/page

echo "build end"