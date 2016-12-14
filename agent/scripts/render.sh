#!/bin/bash
set -e

# Use -gt 1 to consume two arguments per pass in the loop (e.g. each argument has a corresponding value to go with it).
# Use -gt 0 to consume one or more arguments per pass in the loop (e.g. some arguments don't have a corresponding value
# to go with it such as in the --default example).
#
while [[ $# -gt 1 ]]
do
key="$1"

case $key in
    -g|--github-repository-name)
    GITHUB_REPO_NAME="$2"
    shift # past argument
    ;;
    -w|--work-dir)
    WORK_DIR="$2"
    shift # past argument
    ;;
    -t|--title)
    VIDEO_TITLE="$2"
    shift # past argument
    ;;
    -vr|--video-resolution)
    VIDEO_RESOLUTION="$2"
    shift # past argument
    ;;
    -vd|--video-depth)
    VIDEO_DEPTH="$2"
    shift # past argument
    ;;
    -s|--seconds-per-day)
    SEC_PER_DAY="$2"
    shift # past argument
    ;;
    -o|--output-video-name)
    OUTPUT_VIDEO_NAME="$2"
    shift # past argument
    ;;
    *)
    # unknown option
    ;;
esac
shift # past argument or value
done

GITHUB_REPO_NAME="${GITHUB_REPO_NAME:-code-tv/code-tv}"
WORK_DIR="${WORK_DIR:-/work}"
OUTPUT_VIDEO_NAME="${OUTPUT_VIDEO_NAME:-video}"
VIDEO_TITLE="${VIDEO_TITLE:-History of Code}"
VIDEO_RESOLUTION="${VIDEO_RESOLUTION:-960x540}"
VIDEO_DEPTH="${VIDEO_DEPTH:-24}"
SEC_PER_DAY="${SEC_PER_DAY:-1}"

GIT_REPOSITORY_DIR="$WORK_DIR/repository"

echo "Script variables:"
echo GITHUB_REPO_NAME:   ${GITHUB_REPO_NAME}
echo WORK_DIR:           ${WORK_DIR}
echo OUTPUT_VIDEO_NAME:  ${OUTPUT_VIDEO_NAME}
echo GIT_REPOSITORY_DIR: ${GIT_REPOSITORY_DIR}
echo VIDEO_TITLE:        ${VIDEO_TITLE}
echo VIDEO_RESOLUTION:   ${VIDEO_RESOLUTION}
echo VIDEO_DEPTH:        ${VIDEO_DEPTH}
echo SEC_PER_DAY:        ${SEC_PER_DAY}

echo "Refreshing $WORK_DIR working directory..."
rm -rf ${WORK_DIR}/*
mkdir -p ${WORK_DIR}
echo "Done."

echo "Cloning $GITHUB_REPO_NAME repository into $GIT_REPOSITORY_DIR directory..."
git clone https://github.com/${GITHUB_REPO_NAME}.git ${GIT_REPOSITORY_DIR}
echo "Done."

echo "Creating $WORK_DIR/$OUTPUT_VIDEO_NAME.ppm file..."
pushd .
cd ${GIT_REPOSITORY_DIR}
screen -dmS "recording" xvfb-run -a -s "-screen 0 ${VIDEO_RESOLUTION}x${VIDEO_DEPTH}" \
    gource "-$VIDEO_RESOLUTION" \
    -r 30 \
    --title "$VIDEO_TITLE" \
    --user-image-dir /avatars \
    --highlight-all-users \
    --seconds-per-day "$SEC_PER_DAY" \
    --auto-skip-seconds 1 \
    --hide progress,mouse,filenames,dirnames \
    --bloom-multiplier 1.25 \
    --bloom-intensity 0.9 \
    --time-scale 1.0 \
    --stop-at-end \
    -o "$WORK_DIR/$OUTPUT_VIDEO_NAME.ppm"
popd
echo "Done."

previousSize="0"
currentSize="0"
while [[ ${currentSize} -eq "0" || ${previousSize} -lt ${currentSize} ]] ;
do
    sleep 2
    previousSize=${currentSize}
    currentSize=$(stat -c '%s' ${WORK_DIR}/${OUTPUT_VIDEO_NAME}.ppm)
    echo "Current $OUTPUT_VIDEO_NAME.ppm size is $currentSize"
done
echo "The $WORK_DIR/$OUTPUT_VIDEO_NAME.ppm size has stopped growing."
# This hack is needed because gource process doesn't stop;
# MP: it seems that on debian-based node docker image it's not needed
#echo "Force-stopping the recording session."
#screen -r -S "recording" -X quit 2>/dev/null


echo "Creating $WORK_DIR/$OUTPUT_VIDEO_NAME.mp4 file..."
avconv -y -r 30 -f image2pipe \
    -loglevel info \
    -vcodec ppm \
    -i "$WORK_DIR/$OUTPUT_VIDEO_NAME.ppm" \
    -vcodec libx264 \
    -preset medium \
    -pix_fmt yuv420p \
    -crf 1 \
    -threads 0 \
    -bf 0 \
    "$WORK_DIR/$OUTPUT_VIDEO_NAME.mp4"
echo "Done."

echo "Removing the temporary $WORK_DIR/$OUTPUT_VIDEO_NAME.ppm file."
rm -f "$WORK_DIR/$OUTPUT_VIDEO_NAME.ppm"
echo "Done."

echo "Removing $GIT_REPOSITORY_DIR directory..."
rm -rf ${GIT_REPOSITORY_DIR}
echo "Done."

