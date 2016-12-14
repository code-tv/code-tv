'use strict';

const express = require('express');
const router = express.Router();

const spawnCommand = require('child_process').spawn;
const render = (workDir, repoPath, videoId, next) => {
    const renderScript = spawnCommand(
        'scripts/render.sh',
        [
            '--github-repository-name', repoPath,
            '--work-dir', workDir,
            '--title', repoPath,
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
        console.info(`${data}`);
    });

    renderScript.stderr.on('data', function (data) {
        console.info(`${data}`);
    });

    renderScript.on('close', function (code) {
        console.info(`Render script exited with code ${code}`);
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

const upload = (repoPath, localFileName, callback) => {
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

            callback(err, file.name);
        }
    );
};

const getPublicUrl = (filename) => {
    return `https://storage.googleapis.com/${RENDERS_BUCKET}/${filename}`;
};

const createMovie = (orgName, repoName, callback) => {
    console.info(`Rendering movie for repository http://github.com/${orgName}/${repoName}`);

    const videoId = orgName + '__' + repoName;
    const repoPath = orgName + '/' + repoName;
    const workDir = '/work/' + videoId + '_' + Date.now();

    render(workDir, repoPath, videoId, (localFileName) => {
        upload(repoPath, localFileName, (err, uploadedFile) => {
            const deleteWorkDirCmd = spawnCommand('rm', ['-rf', workDir]);
            deleteWorkDirCmd.on('close', function (code) {
                console.info('Work dir "' + workDir + '" delete command completed with code: ' + code);
                callback(getPublicUrl(uploadedFile));
            })
        });
    });
};

/* get/post repository */
router.all('/:org_name/:repo_name', (req, res, callback) => {
    createMovie(req.params.org_name, req.params.repo_name, (redirectUrl) => {
        res.redirect(redirectUrl);
    });
});

const pubSub = require('@google-cloud/pubsub')({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const renderTopic = pubSub.topic('render-tasks');
const renderSubscription = pubSub.subscription(
    'render-agent',
    {
        autoAck: true,
        maxInProgress: 1,
        interval: 10
    }
);
renderSubscription.on("message", function (message) {
    console.info(`Received render request ${message.id}, ${message.data}, ${message.attributes}, ${message.ackId}`);
    // Called every time a message is received.
    // message.id = ID of the message.
    // message.ackId = ID used to acknowledge the message receival.
    // message.data = Contents of the message.
    // message.attributes = Attributes of the message.
    // message.timestamp = Timestamp when Pub/Sub received the message.

    // let jsonMessage = message.data;
    // message.ack(); - already auto-acked
});

// TODO send updates
const renderUpdatesTopicName = 'render-task-updates';

module.exports = router;
