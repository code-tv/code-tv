#!/bin/bash
set -e

rm -f /work/{video.ppm,video.mp4}

VIDEO_RESOLUTION="${VIDEO_RESOLUTION:-1280x720}"
VIDEO_DEPTH="${VIDEO_DEPTH:-24}"
SEC_PER_DAY="${SEC_PER_DAY:-1}"

screen -dmS recording xvfb-run -a -s "-screen 0 ${VIDEO_RESOLUTION}x${VIDEO_DEPTH}" gource "-$VIDEO_RESOLUTION" -r 30 --title "$VIDEO_TITLE" --user-image-dir /avatars/ --highlight-all-users -s 0.5 --seconds-per-day "$SEC_PER_DAY" --hide filenames -o /work/video.ppm

# This hack is needed because gource process doesn't stop
lastsize="0"
filesize="0"
while [[ "$filesize" -eq "0" || $lastsize -lt $filesize ]] ;
do
    sleep 20
    lastsize="$filesize"
    filesize=$(stat -c '%s' /work/video.ppm)
    echo 'Polling the size. Current size is' $filesize
done
echo 'Force stopping recording because file size is not growing'
screen -S recording -X quit

xvfb-run -a -s "-screen 0 ${VIDEO_RESOLUTION}x${VIDEO_DEPTH}" ffmpeg -y -r 30 -f image2pipe -loglevel info -vcodec ppm -i /work/video.ppm -vcodec libx264 -preset medium -pix_fmt yuv420p -crf 1 -threads 0 -bf 0 /work/video.mp4
rm -f /work/video.ppm