#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-github-code-tv}"

gcloud docker -- push gcr.io/$PROJECT_ID/master:latest
