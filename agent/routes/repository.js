var express = require('express');
var router = express.Router();

var datastore = require('@google-cloud/datastore')({
    projectId: process.env.PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

/* ge/post repository */
router.all('/:repo_url', function(req, res, next) {
    var repo_url = req.params.repo_url;
    console.info(repo_url);
    console.info('Waiting for ' + repo_url);

    // var key = datastore.key('repository', repo_url);
    //
    // datastore.get(key, function(err, entity) {
    //     if (err) {
    //         next(err);
    //     }
    //
    //     console.info(entity.repository_url);
    //
    // });

    // get youtube id from our id
    var youtubeId = 'kcABOAAWn6s';

    res.send(`Watch <a href="https://www.youtube.com/watch?v=${youtubeId}">youtube</a> video!`);
});

module.exports = router;
