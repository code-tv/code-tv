const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const pubsub = require('@google-cloud/pubsub')();

const index = require('./routes/index');
const submit = require('./routes/submit');
const video = require('./routes/video');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/submit', submit);
app.use('/video', video);

const renderSubscription = pubsub.subscription(
    'client-notifier',
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

module.exports = app;
