#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-code-tv-service}"

docker build --build-arg http_proxy=$http_proxy --build-arg https_proxy=$https_proxy -t gcr.io/$PROJECT_ID/agent .
