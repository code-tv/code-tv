Gource Agent
============

Gource Agent is a [Docker][docker] containerized process able to generate [Gource][gource] 
video presentations.

Run nodejs app as usual (bin/www) and type http://localhost:8080/repository/234234 in a browser.

# How to build 
## Manually
> docker build -t code-tv/code-tv-agent .
## Script
> ./build-docker.sh

# How to run

## Manually
> docker run -it --rm --name gource-agent \  
>     -v AVATARS_DIR:/avatars \  
>     -v GIT_REPO_DIR:/repository \  
>     -v WORK_DIR:/work \  
>     --env VIDEO_TITLE="My video title" \  
>     code-tv/code-tv-agent
## Script
> export AVATARS_DIR=/tmp/avatars
> export WORK_DIR=/tmp/work
> export GIT_REPO_DIR=/tmp/repository
> export GIT_REPO_URL=https://github.com/code-tv/code-tv.git
> ./run-docker.sh

To customize project avatar images, place the custom avatar images to the `avatars` 
directory. The name of each avatar image must match the username (i.e. `*username*.png`).


[docker]: https://www.docker.com
[gource]: https://code.google.com/p/gource