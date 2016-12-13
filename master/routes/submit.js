var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/', function(req, res) {
    console.info(req.body.repo);
    console.info('submitting ' + req.body.repo);

    //submit and receive an id
    var id = 324234;

    res.writeHead(302, {
        'Location': '/video/' + id
        //add other headers here...
    });
    res.end();
});

module.exports = router;
