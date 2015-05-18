//
// Account Controller
//

'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    multer = require('multer'),
    mkdirp = require('mkdirp'),
    settings = require('./../config').files,
    gm = require('gm').subClass({ imageMagick: true }),
    mongoose = require('mongoose'),
    GridFs = require('gridfs-stream');

var fileUpload = multer({
    putSingleFilesInArray: false,
    limits: {
        files: 1,
        fileSize: settings.maxFileSize
    },
    dest: path.resolve(__dirname, '../../media/photo-uploads')
});

mkdirp.mkdirp(path.resolve(__dirname, '../../media/photo-uploads'));
mkdirp.mkdirp(path.resolve(__dirname, '../../media/photo-uploads/cropped'));

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares,
        models = this.models,
        User = models.user;

    //
    // Routes
    //
    app.route('/uploadProfilePicture')
        .post(fileUpload, middlewares.requireLogin, function(req, res) {
            var srcPath = req.files.userPhoto.path;

            gm(srcPath).resize(379, null).write(srcPath, function(err) {
                if(err){
                    return res.sendStatus(500);
                }

                res.send({
                    path: '/media/photo-uploads/' + req.files.userPhoto.name
                });
            });

        });

    app.post('/cropProfilePicture', function(req, res){
        var gfs = new GridFs(mongoose.connection.db, mongoose.mongo);
        var gm = require('gm').subClass({ imageMagick: true });
        var srcPath = path.resolve(__dirname, '../../media/photo-uploads', req.body.name);
        var coords = req.body.data;

        gm(srcPath).crop(coords.w, coords.h, coords.x, coords.y).write(srcPath, function(err){
            if (err) {
                return res.status(500).send(err);
            }

            gfs.remove({ filename: req.user.username }, function (err) {
                if (err) return res.status(500).send(err);

                var writeStream = gfs.createWriteStream({filename: req.user.username});

                fs.createReadStream(srcPath)
                    .pipe(writeStream);

                writeStream.on('close', function (file) {
                    // Clean up
                    fs.unlink(srcPath, function (err) {
                        if (err) return res.status(500).send(err);

                        res.sendStatus(200);
                    });
                });
            });
        });
    });

    app.get('/getProfilePicture/:username?', function (req, res) {

        var username = req.params.username ? req.params.username : req.user.username;

        var gfs = new GridFs(mongoose.connection.db, mongoose.mongo);

        gfs.exist({filename: username}, function (err, found) {
            if (err) return res.status(500).send(err);
            res.writeHead(200, {'Content-Type': 'image/png' });
            if(found){
                gfs.createReadStream({filename: username})
                    // and pipe it to Express' response
                    .pipe(res);
            } else {
                // console.log('path.resolve', req.user.defaultAvatar);
                var readStream = fs.createReadStream(path.resolve('media/profile_icons/', req.user.defaultAvatar || 'User-blue-icon.png'));
                // We replaced all the event handlers with a simple call to readStream.pipe()
                readStream.pipe(res);
            }
        });
    })
};
