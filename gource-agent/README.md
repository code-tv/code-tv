Gource Agent
============

Gource Agent is a [Docker][docker] containerized process able to generate [Gource][gource] 
video presentations.

# How to build
> docker build -t code-tv/gource-agent .  

# How to run
> docker run -it --rm --name gource-agent \  
>     -v AVATARS_DIR:/avatars \  
>     -v REPOSITORY_DIR:/repository \  
>     -v WORK_DIR:/work \  
>     --env VIDEO_TITLE="My video title" \  
>     code-tv/gource-agent

To customize project avatar images, place the custom avatar images to the `avatars` 
directory. The name of each avatar image must match the username (i.e. `*username*.png`).


[docker]: https://www.docker.com
[gource]: https://code.google.com/p/gource