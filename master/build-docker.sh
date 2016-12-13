#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-github-code-tv}"

docker build --build-arg HTTP_PROXY=$http_proxy --build-arg HTTPS_PROXY=$https_proxy -t gcr.io/$PROJECT_ID/master .
