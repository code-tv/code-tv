#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-github-code-tv}"

docker run -p 8080:8080 -d gcr.io/$PROJECT_ID/master
