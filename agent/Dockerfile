FROM node:7.2.1

RUN apt-get update -y && apt-get install -y software-properties-common
RUN apt-get update -y && apt-get install -y git mercurial xvfb xfonts-base xfonts-75dpi xfonts-100dpi xfonts-cyrillic gource libav-tools screen

VOLUME ["/avatars", "/work", "/credentials"]

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install
# Bundle app source
COPY . /usr/src/app

ENV GCLOUD_PROJECT=code-tv-service

EXPOSE 8080
CMD [ "npm", "start" ]
