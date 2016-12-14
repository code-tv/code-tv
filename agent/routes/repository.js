var express = require('express');
var router = express.Router();

var datastore = require('@google-cloud/datastore')();

/* get/post repository */
router.all('/:org_name/:repo_name', function (req, res, next) {
    var org_name = req.params.org_name;
    var repo_name = req.params.repo_name;

    console.info('Requested repository: ' + org_name + '/' + repo_name);

    // var key = datastore.key('repository', repo_name);
    //
    // datastore.get(key, function(err, entity) {
    //     if (err) {
    //         next(err);
    //     }
    //
    //     console.info(entity.key);
    // });

    // RUN video generation script
    var spawnCommand = require('child_process').spawn;
    var renderScript = spawnCommand(
        "scripts/render.sh",
        [
            '--github-repository-name', org_name + '/' + repo_name,
            '--work-dir', '/work',
            '--title', 'Title: Invoked from Node',
            '--video-resolution', '960x540',
            '--video-depth', '24',
            '--seconds-per-day', '0.5'
        ],
        {
            shell: '/bin/bash'
        }
    );

    renderScript.stdout.on('data', function (data) {
        res.write(data);
    });

    renderScript.stderr.on('data', function (data) {
        res.write(data);
    });

    renderScript.on('close', function (code) {
        res.write('render script exited with code: ' + code);
    });
});

module.exports = router;
