#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-code-tv-service}"

docker run -p 8081:8080 -d gcr.io/$PROJECT_ID/agent
