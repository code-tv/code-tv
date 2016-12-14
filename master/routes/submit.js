const express = require('express');
const router = express.Router();

const request = require('request');
const pubsub = require('@google-cloud/pubsub')();

const datastore = require('@google-cloud/datastore')();

/* GET users listing. */
router.post('/', (req, res, next) => {

    const repo_fullname = req.body.repo;

    const splitted_repo = repo_fullname.split('/');
    const org_name = splitted_repo[0];
    const repo_name = splitted_repo[1];

    console.info(repo_fullname);
    console.info('submitting ' + repo_fullname);

    const key = datastore.key('repository');
    const data = {
        org_name: org_name,
        repo_name: repo_name,
        state: 'initial'
    };

    datastore.save(
        {
            key: key,
            data: data
        },
        (err) => {
            console.info('saving ' + repo_fullname);
            if (!err) {
                console.info("Repository has been saved in datastore.");

                const topic = pubsub.topic('render-tasks');
                topic.publish(key.id);

                res.writeHead(302, {
                    'Location': '/video/' + key.id
                    //add other headers here...
                });

                console.info(`Message '${key.id}' sent.`);

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
