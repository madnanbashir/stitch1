/*
 * STATUS VIEW
 * Shows the user connected/disconnected
 */

'use strict';
+function(window, $, _) {

    var jcrop_api;
    var boundx, boundy;
    var $preview = $('#profile-photo-preview-pane');
    var info = {};
    var imgUrl;
    var xscale, yscale;

    window.LCB = window.LCB || {};

    window.LCB.ProfilePictureModalView = window.LCB.ModalView.extend({
        events: {
            'change #photo-input': 'inputChange',
            'submit #upload-form': 'submitForm',
            'click #send-crop': 'sendCrop',
            'click #cancel-crop': 'cancelCrop'
        },
        success: function() {
            swal('Profile Updated!', 'Your profile picture has been updated.',
                'success');
            this.$el.modal('hide');
        },
        error: function() {
            swal('Woops!', 'Your profile picture was not updated.', 'error');
        },
        inputChange: function(event) {
            $('#upload-form').submit();
        },
        submitForm: function(event) {
            //status('uploading the file ...');
            var thisObj = this;
            $('#upload-form').ajaxSubmit({

                error: function(xhr) {
                    status('Error: ' + xhr.status);
                },

                success: function(response) {
                    if(response.error){
                        status('Something went wrong.');
                        return;
                    }

                    imgUrl = response.path;

                    //status('Success, file uploaded to:' + imgUrl);
                    if(jcrop_api) {
                        jcrop_api.destroy();
                    }

                    $('#uploaded-image').width('');
                    $('#uploaded-image').height('');

                    $('#uploaded-image').attr({'src':imgUrl});
                    $('#uploaded-image').show();

                    $('#cropped-photo').attr({'src':imgUrl});
                    $('#cropped-photo').show();

                    $('#profile-photo-preview-pane').show();

                    $('#uploaded-image').Jcrop({
                        minSize: [ 50,50 ],
                        onChange: thisObj.showPreview,
                        onSelect: thisObj.showPreview,
                        onRelease: thisObj.disablePreview,
                        aspectRatio: 1,
                        setSelect: [0,0,50,50]
                    }, function(){
                        // Use the API to get the real image size
                        var bounds = this.getBounds();
                        boundx = bounds[0];
                        boundy = bounds[1];

                        var img = document.getElementById('uploaded-image');
                        //or however you get a handle to the IMG
                        var naturalw = img.naturalWidth;
                        var naturalh = img.naturalHeight;

                        xscale = naturalw / boundx;
                        yscale = naturalh / boundy;

                        jcrop_api = this;
                        thisObj.showPreview({
                            x: 0,
                            y: 0,
                            w: 50,
                            h: 50
                        });
                        // Move the preview into the jcrop container for css positioning
                        $preview.appendTo(jcrop_api.ui.holder);
                    });


                }
            });

            return false;
        },
        sendCrop: function(event) {
            var thisObj = this;
            info.x = Math.round(xscale * info.x);
            info.y = Math.round(yscale * info.y);
            info.w = Math.round(xscale * info.w);
            info.h = Math.round(yscale * info.h);

            $.ajax({
                type: "POST",
                url: "/cropProfilePicture",
                data: {'src':imgUrl, 'name':imgUrl.substr(imgUrl.lastIndexOf("/") + 1), 'data':info},
                success: function(res){
                    if(res == "OK")
                    {
                        //status('Image Cropped');
                        jcrop_api.destroy();
                        $('#uploaded-image').removeAttr('src');
                        $('#uploaded-image').hide();

                        $('#cropped-photo').removeAttr('src');
                        $('#cropped-photo').hide();

                        $('#profile-photo-preview-pane').hide();
                        thisObj.disablePreview();
                        $('#photo-input').val('');

                        setTimeout(function(){
                            var pp = $('.lcb-avatar')[0];
                            var src = thisObj.getImgSrc(pp.src) + "?" + new Date().getTime();
                            pp.src = src;

                            var pp2 = document.getElementById('profile-photo');
                            var src = thisObj.getImgSrc(pp2.src) + "?" + new Date().getTime();
                            pp2.src = src;

                        }, 1000);

                        $('#uploaded-image').width('');
                        $('#uploaded-image').height('');
                    }
                    else
                    {
                        status('Err' + res);
                    }
                }

            })
        },
        disablePreview: function() {
            $('#send-crop').attr('disabled', 'disabled')
        },
        showPreview: function(coords){
            info = coords;
            $('#send-crop').removeAttr('disabled');

            if (parseInt(coords.w) > 0)
            {
                var rx = $('#cropped-photo-container').width() / coords.w;
                var ry = $('#cropped-photo-container').height() / coords.h;

                $('#cropped-photo').css({
                    width: Math.round(rx * (boundx | 50)) + 'px',
                    height: Math.round(ry * (boundy | 50)) + 'px',
                    marginLeft: '-' + Math.round(rx * coords.x) + 'px',
                    marginTop: '-' + Math.round(ry * coords.y) + 'px'
                });
            }
        },
        cancelCrop: function(){
            if(jcrop_api) {
                jcrop_api.destroy();
            }
            $('#uploaded-image').removeAttr('src');
            $('#uploaded-image').hide();

            $('#cropped-photo').removeAttr('src');
            $('#cropped-photo').hide();

            $('#profile-photo-preview-pane').hide();

            $('#uploaded-image').width('100%');
            $('#uploaded-image').height('');
            this.disablePreview();
            $('#photo-input').val('');
        },
        getImgSrc: function (src) {
            var i = src.indexOf("?");

            if(i > 0)
                return  src.slice(0, i);
            else
                return src;
        }
    });
}(window, $, _);
