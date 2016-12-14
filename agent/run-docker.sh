#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-code-tv-service}"

set -e

docker run -it \
            --name code-tv-agent \
            -v ${WORK_DIR:-"/tmp"}:/work \
            -v ${AVATAR_DIR:-"/tmp/avatar"}:/avatar \
            -v $HOME/.config/gcloud:/credentials \
            -e GOOGLE_APPLICATION_CREDENTIALS=/credentials/application_default_credentials.json \
            -e GCLOUD_PROJECT=$PROJECT_ID \
            -p 8081:8080 -d gcr.io/$PROJECT_ID/agent
