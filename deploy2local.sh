#!/bin/bash

echo "deploy tms-frontend to tomcat start"

DEST=/Users/xiweicheng/Applications/apache-tomcat-8.5.59
SRC=/Users/xiweicheng/tms-frontend

echo "DEST DIR: $DEST"
echo "SRC DIR: $SRC"

echo "au pkg --env prod"

cd $SRC
au pkg --env prod

DT=`date +"%Y%m%d%H%M%S"`
mkdir -p $DEST/backup/tms-frontend/$DT
cp -rf $DEST/webapps/ROOT/WEB-INF/classes/static/page $DEST/backup/tms-frontend/$DT
echo "backup path: $DEST/backup/tms/tms-frontend/$DT"

echo "rm cdn & scripts & index.html & blog.html & mind.html & excel.html"

rm -rf $DEST/webapps/ROOT/WEB-INF/classes/static/page/cdn
rm -rf $DEST/webapps/ROOT/WEB-INF/classes/static/page/scripts
rm -rf $DEST/webapps/ROOT/WEB-INF/classes/static/page/index.html
rm -rf $DEST/webapps/ROOT/WEB-INF/classes/static/page/blog.html
rm -rf $DEST/webapps/ROOT/WEB-INF/classes/static/page/mind.html
rm -rf $DEST/webapps/ROOT/WEB-INF/classes/static/page/excel.html

echo "cp tms-frontend to local tomcat"

cp -rf $SRC/cdn $DEST/webapps/ROOT/WEB-INF/classes/static/page
cp -rf $SRC/scripts $DEST/webapps/ROOT/WEB-INF/classes/static/page
cp -rf $SRC/index.html $DEST/webapps/ROOT/WEB-INF/classes/static/page
cp -rf $SRC/blog.html $DEST/webapps/ROOT/WEB-INF/classes/static/page
cp -rf $SRC/mind.html $DEST/webapps/ROOT/WEB-INF/classes/static/page
cp -rf $SRC/excel.html $DEST/webapps/ROOT/WEB-INF/classes/static/page


sh $DEST/bin/shutdown.sh
sleep 5
sh $DEST/bin/startup.sh

echo "deploy tms-frontend to tomcat end"