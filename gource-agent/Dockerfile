FROM ubuntu:14.04

RUN apt-get update -y && apt-get install -y software-properties-common
RUN add-apt-repository -y ppa:kirillshkrogalev/ffmpeg-next
RUN apt-get update -y && apt-get install -y git mercurial xvfb xfonts-base xfonts-75dpi xfonts-100dpi xfonts-cyrillic gource ffmpeg screen

ADD ./run.sh /run.sh

ENV TITLE "Gource Video"

VOLUME ["/avatars", "/repository", "/work"]

WORKDIR /repository

CMD bash /run.sh