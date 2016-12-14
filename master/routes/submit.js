var express = require('express');
var router = express.Router();

var request = require('request');

var datastore = require('@google-cloud/datastore')();

var pubsub = require('@google-cloud/pubsub')();

/* GET users listing. */
router.post('/', function (req, res, next) {

    const repo_fullname = req.body.repo;

    const splitted_repo = repo_fullname.split('/');
    const org_name = splitted_repo[0];
    const repo_name = splitted_repo[1];

    console.info(repo_fullname);
    console.info('submitting ' + repo_fullname);

    var key = datastore.key('repository');
    var data = {
        org_name: org_name,
        repo_name: repo_name,
        state: 'initial'
    };

    datastore.save({
        key: key,
        data: data
    }, function (err) {
        console.info('saving ' + repo_fullname);
        if (!err) {
            console.info("Repository has been saved in datastore.");

            request.post(
                `http://code-tv-agent:8080/repository/${org_name}/${repo_name}`, function (err, httpResponse, body) {
                    console.error("Request failed.");
                    console.error(err);
                    next(err);
                });

            res.writeHead(302, {
                'Location': '/video/' + key
                //add other headers here...
            });

            res.end();
        } else {
            console.error("Repository cannot be stored.");
            console.error(err);
            next(err);
        }
    });

    console.info('after save ' + repo_fullname);

});

module.exports = router;
