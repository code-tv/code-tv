var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:id', function(req, res) {
    console.info(req.params.id);
    console.info('Waiting for ' + req.params.id);

    // get youtube id from our id
    var youtubeId = 'kcABOAAWn6s';

    res.render('video.pug', {
        youtubeId: youtubeId
    });
});

module.exports = router;
