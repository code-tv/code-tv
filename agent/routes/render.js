const express = require('express');
const router = express.Router();

const spawnCommand = require('child_process').spawn;
const render = (workDir, repoPath, videoId, res, next) => {
    const renderScript = spawnCommand(
        'scripts/render.sh',
        [
            '--github-repository-name', repoPath,
            '--work-dir', workDir,
            '--title', 'Title: Invoked from Node',
            '--video-resolution', '960x540',
            '--video-depth', '24',
            '--seconds-per-day', '0.5',
            '--output-video-name', videoId
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
        next(`${workDir}/${videoId}.mp4`)
    });
};


// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/latest/guides/authentication
// These environment variables are set automatically on Google App Engine
const CloudStorage = require('@google-cloud/storage');
// Instantiate a cloudStorageClient client
const cloudStorageClient = CloudStorage({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});
// A bucket is a container for objects (files).
const RENDERS_BUCKET = 'code-tv-renders';
const rendersBucket = cloudStorageClient.bucket(RENDERS_BUCKET);

const upload = (repoPath, localFileName, next) => {
    const uploadFileName = `${repoPath}.mp4`;

    console.info(`Uploading local file "${localFileName}" as ${uploadFileName} into ${RENDERS_BUCKET} bucket.`);

    rendersBucket.upload(
        localFileName,
        {
            destination: uploadFileName,
            metadata: {
                contentType: 'video/mp4'
            },
            public: true,
        },
        (err, file) => {
            if (err) {
                console.error(`Error uploading file "${file}": ${err}`);
            } else {
                console.info(`File "${file.name}" has been uploaded to GCS.`);
            }

            next(err, file);
        }
    );
};

const getPublicUrl = (filename) => {
    return `https://storage.googleapis.com/${RENDERS_BUCKET}/${filename}`;
};

/* get/post repository */
router.all('/:org_name/:repo_name', function (req, res, next) {
    const orgName = req.params.org_name;
    const repoName = req.params.repo_name;
    const videoId = orgName + '__' + repoName;
    const repoPath = orgName + '/' + repoName;
    const workDir = '/work/' + videoId + '_' + Date.now();

    console.info('Requested repository: ' + orgName + '/' + repoName);

    // var key = DataStore.key('repository', repoName);
    //
    // DataStore.get(key, function(err, entity) {
    //     if (err) {
    //         next(err);
    //     }
    //
    //     console.info(entity.repository_url);
    //
    // });

    render(workDir, repoPath, videoId, res, (localFileName) => {
        upload(repoPath, localFileName, (err, uploadedFile) => {
        // upload(repoPath, `/tmp/code-tv__code-tv_1481722425075/${videoId}.mp4`, (err, uploadedFile) => {
            const deleteWorkDirCmd = spawnCommand('rm', ['-rf', workDir]);
            deleteWorkDirCmd.on('close', function (code) {
                console.info('Work dir "' + workDir +'" delete command completed with code: ' + code);
                next(err, uploadedFile);
            })
        });
    });
});


module.exports = router;
