/**
 * Created by m_potociar on 14/12/2016.
 */
'use strict';

const http = require('http');
const path = require('path');
const express = require('express');
const expressWs = require('express-ws');
const bodyParser = require('body-parser');
// const uuid = require('node-uuid');

const expressInstance = expressWs(express());
const app = expressInstance.app;

app.use(bodyParser.json({limit: '500kb'}));
app.use(bodyParser.urlencoded({limit: '500kb', extended: true}));
app.use(express.static('public'));
app.ws('/', function (ws, req) {
    ws.on('message', function (msg) {

    });
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


const projectId = process.env.GCLOUD_PROJECT;
const keyFileName = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const pubsub = require('@google-cloud/pubsub')({
    projectId: projectId,
    keyFilename: keyFileName
});
const datastore = require('@google-cloud/datastore')({
    projectId: projectId,
    keyFilename: keyFileName
});

app.get('/', function (req, res, next) {
    res.render('home.pug');
});

app.post('/submit', (req, res, next) => {

    const fullRepoPath = req.body.repoPath;

    const splitRepoPath = fullRepoPath.split('/');
    const orgName = splitRepoPath[0];
    const repoName = splitRepoPath[1];

    console.info(fullRepoPath);
    console.info('submitting ' + fullRepoPath);

    const key = datastore.key('repository');
    const data = {
        org_name: orgName,
        repo_name: repoName,
        state: 'initial'
    };

    datastore.save(
        {
            key: key,
            data: data
        },
        (err) => {
            console.info('saving ' + fullRepoPath);
            if (!err) {
                console.info("Repository has been saved in datastore.");

                const topic = pubsub.topic('render-tasks');
                topic.publish(key.id);
                console.info(`Message '${key.id}' sent.`);

                const responseData = {
                    videoId: key.id
                };
                res.send(responseData);
            } else {
                console.error("Repository cannot be stored.");
                console.error(err);
                next(err);
            }
        });

    console.info('after save ' + fullRepoPath);
});

/* GET users listing. */
app.get('/video/:id', function (req, res) {
    console.info(req.params.id);
    console.info('Waiting for ' + req.params.id);

    // get youtube id from our id
    var youtubeId = 'kcABOAAWn6s';

    // res.sendFile('video.html', { root: __dirname + '/../views/'});
    res.render('video.pug', {
        youtubeId: youtubeId
    });
});

/*  */
const renderSubscription = pubsub.subscription(
    'client-notifier',
    {
        autoAck: true,
        maxInProgress: 1,
        interval: 10
    }
);
renderSubscription.on("message", function (message) {
    console.info(`Received render response:\nstatus: ${message.data}, recordId: ${message.attributes.record_id}, movie URL: ${message.attributes.movie_link}`);

    const wss = expressInstance.getWss('/');
    wss.clients.forEach(function (wsConnection) {
        wsConnection.send(JSON.stringify({
            recordId: message.attributes.record_id,
            status: message.data,
            movieLink: message.attributes.movie_link
        }));
    });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    console.error(`Caught unhandled error: ${err.message}`);
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

process.on('exit', function () {
    console.log("exit!");
});

process.on('SIGINT', function () {
    console.log("exit-siging!");
    process.exit();
});

app.listen(8080);
