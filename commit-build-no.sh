#!/bin/bash

echo "auto commit start"

git add .
git commit -m "界面优化..."

git push origin master
git push github master

sh build-no.sh

cd  ../tms
pwd

git add .
git commit -m "合并前端静态打包资源"

git push origin master
git push github master

echo "auto commit end"