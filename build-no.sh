#!/bin/bash

echo "build start"

DEST=/Users/xiweicheng/tms/src/main/resources/static
SRC=/Users/xiweicheng/tms-frontend

DEST2=/Users/xiweicheng/tms-landing

echo "DEST DIR: $DEST"
echo "SRC DIR: $SRC"

# echo "au pkg --env prod"

cd $SRC
# au pkg --env prod

echo "rm page/scripts & page/index.html & page/blog.html & page/gantt"

rm -rf $DEST/page/scripts
rm -rf $DEST/page/index.html
rm -rf $DEST/page/blog.html
rm -rf $DEST/page/excel.html
rm -rf $DEST/page/sheet.html
rm -rf $DEST/page/mind.html
rm -rf $DEST/page/gantt
rm -rf $DEST/page/cdn
# rm -rf $DEST/page/alert.mp3
# rm -rf $DEST/page/alert.ogg

echo "cp tms-frontend to tms"

cp -rf $SRC/scripts $DEST/page
cp -rf $SRC/index.html $DEST/page
cp -rf $SRC/blog.html $DEST/page
cp -rf $SRC/excel.html $DEST/page
cp -rf $SRC/sheet.html $DEST/page
cp -rf $SRC/mind.html $DEST/page
cp -rf $SRC/gantt $DEST/page
cp -rf $SRC/cdn $DEST/page
# cp -rf alert.mp3 $DEST/page
# cp -rf alert.ogg $DEST/page
# cp -rf $SRC/font-awesome.min.css $DEST/page
# cp -rf $SRC/fonts $DEST/page

rm -rf $DEST2/page/blog.html
rm -rf $DEST2/page/excel.html
rm -rf $DEST2/page/sheet.html
rm -rf $DEST2/page/mind.html
rm -rf $DEST2/page/cdn

cp -rf $SRC/blog.html $DEST2/page
cp -rf $SRC/excel.html $DEST2/page
cp -rf $SRC/sheet.html $DEST2/page
cp -rf $SRC/mind.html $DEST2/page
cp -rf $SRC/cdn $DEST2/page

echo "build end"