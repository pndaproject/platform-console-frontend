#!/bin/bash
#
# Please check pnda-build/ for the build products
set -e

VERSION=${1}

function error {
    echo "Not Found"
    echo "Please run the build dependency installer script"
    exit -1
}

echo -n "npm: "
NPM_VERSION=$(npm --version 2>&1)
if [[ ${NPM_VERSION} == "1.3"* ]] || [[ ${NPM_VERSION} == "3.5.2" ]] || [[ ${NPM_VERSION} == "3.10"* ]]; then
    echo "OK"
else
    error
fi

echo -n "grunt-cli: "
if [[ $(grunt --version 2>&1) == *"grunt-cli v1.2"* ]]; then
    echo "OK"
else
    error
fi

mkdir -p pnda-build
cd console-frontend
rm -rf node_modules
npm install
echo "{ \"name\": \"console-frontend\", \"version\": \"${VERSION}\" }" > package-version.json
grunt package
cd ..
mv console-frontend/console-frontend-$VERSION.tar.gz pnda-build/
sha512sum pnda-build/console-frontend-$VERSION.tar.gz > pnda-build/console-frontend-$VERSION.tar.gz.sha512.txt
