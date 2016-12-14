'use strict';

/**
 * Rendering Logic
 */
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

/**
 * Upload to Google Cloud Storage Logic
 */
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

/**
 * Google Datastore Operations
 */
const dataStore = require('@google-cloud/datastore')({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});


const loadRecord = (recordId, callback) => {
    const key = dataStore.key(['repository', recordId]);
    dataStore.get(key, (err, entity) => {
        if (err) {
            console.error(`Unable to retrieve data for record id "${recordId}": ${err.toString()}`);
            return;
        }

        console.info(`Entity loaded for record id "${recordId}".`);

        const orgName = entity['org_name'];
        const repoName = entity['repo_name'];

        callback(orgName, repoName);
    })
};

// TODO updade the record in Google Datastore
// const updateRecord = () => {
// };

/**
 * Google PubSub Messaging Logic
 */
const pubSub = require('@google-cloud/pubsub')({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const renderSubscription = pubSub.subscription(
    'render-agent',
    {
        autoAck: true,
        maxInProgress: 1,
        interval: 10
    }
);

const updatesTopic = pubSub.topic('render-task-updates');
renderSubscription.on("message", function (message) {
    console.info(`Received render request:\n  id:   ${message.id}\n  data: ${message.data}`);

    loadRecord(message.data, (orgName, repoName) => {
        console.info(`Starting to create a movie for ${orgName}/${repoName}`);
        createMovie(orgName, repoName, (publicMovieUrl) => {
            console.info(`Publishing info about the newly rendered movie URL for record id "${message.data}": ${publicMovieUrl}`);
            const doneMsg = {
                data: "DONE",
                attributes: {
                    movie_link: `${publicMovieUrl}`,
                    record_id: `${message.data}`
                }
            };
            const options = {
                raw: true
            };

            updatesTopic.publish(doneMsg, options, (err, messageIds, apiResponse) => {
                if (err) {
                    console.error(`Unable to send back notification for record id "${message.data}": ${err.toString()}`);
                }
            });
        })
    })
});

/**
 * Express.js Routing Logic
 */
const express = require('express');
const router = express.Router();

/* get/post repository */
router.all('/:org_name/:repo_name', (req, res, callback) => {
    createMovie(req.params.org_name, req.params.repo_name, (publicMovieUrl) => {
        res.redirect(publicMovieUrl);
    });
});

module.exports = router;
