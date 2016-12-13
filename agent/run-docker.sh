#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-code-tv-service}"

set -e

DEFAULT_AVATAR_DIR=/tmp
DEFAULT_WORK_DIR=/tmp/work

git clone ${GIT_REPO_URL} ${GIT_REPO_DIR}

docker run -it \
            --name gource-agent \
            -v ${GIT_REPO_DIR}:/repository \
            -v ${WORK_DIR:-"/tmp/work"}:/work \
            -v ${AVATAR_DIR:-"/tmp/avatar"}:/avatar \
            --env VIDEO_TITLE=${VIDEO_TTITLE:-"Code-TV"} \
            -p 8081:8080 -d gcr.io/$PROJECT_ID/agent
