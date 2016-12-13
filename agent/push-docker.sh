#!/usr/bin/env bash

PROJECT_ID="${PROJECT_ID:-code-tv-service}"

gcloud docker -- push gcr.io/$PROJECT_ID/agent:latest
