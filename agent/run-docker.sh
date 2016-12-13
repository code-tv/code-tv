#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-code-tv-service}"

set -e

#git clone ${GIT_REPO_URL} ${GIT_REPO_DIR}

docker run -it \
            --name code-tv-agent \
            -v ${WORK_DIR:-"/tmp"}:/work \
            -v ${AVATAR_DIR:-"/tmp/avatar"}:/avatar \
            -p 8081:8080 -d gcr.io/$PROJECT_ID/agent
#            /usr/src/app/scripts/render.sh -g code-tv/code-tv -w /work -t Code TV Video -t "Custom title" -s 0.5
