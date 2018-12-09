#!/bin/bash

echo "auto commit start"

git push github master

sh build.sh

cd  ../tms

pwd

git add .

git commit -m "合并前端静态打包资源"

git push origin master

git push github master

echo "auto commit end"