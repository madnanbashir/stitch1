/*
 * MODAL VIEWS
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ModalView = Backbone.View.extend({
        events: {
        	'submit form': 'submit'
        },
        initialize: function(options) {
            this.render();
        },
        render: function() {
            this.$('form.validate').validate();
            this.$el.on('shown.bs.modal hidden.bs.modal',
                        _.bind(this.refresh, this));
        },
        refresh: function() {
            var that = this;
            this.$('[data-model]').each(function() {
                $(this).val && $(this).val(that.model.get($(this).data('model')));
            });
        },
        success: function() {
            swal('Updated!', '', 'success');
            this.$el.modal('hide');
        },
        error: function() {
            swal('Woops!', '', 'error');
        },
        submit: function(e) {
        	e && e.preventDefault();

            var $form = this.$('form[action]');
            var opts = {
                type: $form.attr('method') || 'POST',
                url: $form.attr('action'),
                data: $form.serialize(),
                dataType: 'json'
            };

            if (this.success) {
                opts.success = _.bind(this.success, this);
            }
            if (this.error) {
                opts.error = _.bind(this.error, this);
            }
            if (this.complete) {
                opts.complete = _.bind(this.complete, this);
            }

            $.ajax(opts);
        }
    });

    window.LCB.ProfileModalView = window.LCB.ModalView.extend({
        success: function() {
            swal('Profile Updated!', 'Your profile has been updated.',
                 'success');
            this.$el.modal('hide');
        },
        error: function() {
            swal('Woops!', 'Your profile was not updated.', 'error');
        }
    });

    window.LCB.AccountModalView = window.LCB.ModalView.extend({
        success: function() {
            swal('Account Updated!', 'Your account has been updated.', 'success');
            this.$el.modal('hide');
            this.$('[type="password"]').val('');
        },
        error: function(req) {
            var message = req.responseJSON && req.responseJSON.reason ||
                          'Your account was not updated.';

            swal('Woops!', message, 'error');
        },
        complete: function() {
            this.$('[name="current-password"]').val('');
        }
    });

    window.LCB.AuthTokensModalView = Backbone.View.extend({
        events: {
            'click .generate-token': 'generateToken',
            'click .revoke-token': 'revokeToken'
        },
        initialize: function(options) {
            this.render();
        },
        render: function() {
            this.$el.on('shown.bs.modal hidden.bs.modal',
                        _.bind(this.refresh, this));
        },
        refresh: function() {
            this.$('.token').val('');
            this.$('.generated-token').hide();
        },
        getToken: function() {
            var that = this;
            $.post('./account/token/generate', function(data) {
                if (data.token) {
                    that.$('.token').val(data.token);
                    that.$('.generated-token').show();
                }
            });
        },
        removeToken: function() {
            var that = this;
            $.post('./account/token/revoke', function(data) {
                that.refresh();
                swal('Success', 'Authentication token revoked!', 'success');
            });
        },
        generateToken: function() {
            swal({
                title: 'Are you sure?',
                text: 'This will overwrite any existing authentication token you may have.',   type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                closeOnConfirm: true },
                _.bind(this.getToken, this)
            );
        },
        revokeToken: function() {
            swal({
                title: 'Are you sure?',
                text: 'This will revoke access from any process using your current authentication token.',   type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                closeOnConfirm: false },
                _.bind(this.removeToken, this)
            );
        }
    });

    window.LCB.NotificationsModalView = Backbone.View.extend({
        events: {
            'click [name=desktop-notifications]': 'toggleDesktopNotifications'
        },
        initialize: function() {
            this.render();
        },
        render: function() {
            var $input = this.$('[name=desktop-notifications]');
            $input.find('.disabled').show()
              .siblings().hide();
            if (!notify.isSupported) {
                $input.attr('disabled', true);
                // Welp we're done here
                return;
            }
            if (notify.permissionLevel() === notify.PERMISSION_GRANTED) {
                $input.find('.enabled').show()
                  .siblings().hide();
            }
            if (notify.permissionLevel() === notify.PERMISSION_DENIED) {
                $input.find('.blocked').show()
                  .siblings().hide();
            }
        },
        toggleDesktopNotifications: function() {
            var that = this;
            if (!notify.isSupported) {
                return;
            }
            notify.requestPermission(function() {
                that.render();
            });
        }
    });

    window.LCB.FindPatientsView = window.LCB.ModalView.extend({
        events: {
            'keyup .lcb-rooms-browser-filter-input': 'filter',
            'change .lcb-rooms-switch': 'toggle',
            'click .lcb-rooms-switch-label': 'toggle'
        },
        initialize: function(options) {
            this.client = options.client;
            this.template = Handlebars.compile($('#template-room-browser-item').html());
            this.userTemplate = Handlebars.compile($('#template-room-browser-item-user').html());
            this.rooms = options.rooms;
            this.rooms.on('add', this.add, this);
            this.rooms.on('remove', this.remove, this);
            this.rooms.on('change:description change:name', this.update, this);
            this.rooms.on('change:lastActive', _.debounce(this.updateLastActive, 200), this);
            this.rooms.on('change:joined', this.updateToggles, this);
            this.rooms.on('users:add', this.addUser, this);
            this.rooms.on('users:remove', this.removeUser, this);
            this.rooms.on('users:add users:remove add remove', this.sort, this);
            this.rooms.current.on('change:id', function(current, id) {
                // We only care about the list pane
                if (id !== 'list') return;
                this.sort();
            }, this);
        },
        updateToggles: function(room, joined) {
            this.$('.lcb-rooms-switch[data-id=' + room.id + ']').prop('checked', joined);
        },
        toggle: function(e) {
            e.preventDefault();
            var $target = $(e.currentTarget),
                $input = $target.is(':checkbox') && $target || $target.siblings('[type="checkbox"]'),
                id = $input.data('id'),
                room = this.rooms.get(id);
            if (!room) {
                return;
            }
            (!$input.is(':checked') && this.client.joinRoom(room.id)) ||
                (this.rooms.get(room.id).get('joined') && this.client.leaveRoom(room.id));
        },
        add: function(room) {
            var room = room.toJSON ? room.toJSON() : room,
                context = _.extend(room, {
                    lastActive: moment(room.lastActive).calendar()
                });
            this.$('.lcb-rooms-list').append(this.template(context));
        },
        remove: function(room) {
            this.$('.lcb-rooms-list-item[data-id=' + room.id + ']').remove();
        },
        update: function(room) {
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-name').text(room.get('name'));
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-description').text(room.get('description'));
        },
        updateLastActive: function(room) {
            this.$('.lcb-rooms-list-item[data-id=' + room.id + '] .lcb-rooms-list-item-last-active .value').text(moment(room.get('lastActive')).calendar());
        },
        sort: function(model) {
            var that = this,
                $items = this.$('.lcb-rooms-list-item');
            // We only care about other users
            if (this.$el.hasClass('hide') && model && model.id === this.client.user.id)
                return;
            $items.sort(function(a, b){
                var ar = that.rooms.get($(a).data('id')),
                    br = that.rooms.get($(b).data('id')),
                    au = ar.users.length,
                    bu = br.users.length,
                    aj = ar.get('joined'),
                    bj = br.get('joined')
                if ((aj && bj) || (!aj && !bj)) {
                    if (au > bu) return -1;
                    if (au < bu) return 1;
                }
                if (aj) return -1;
                if (bj) return 1;
                return 0;
            });
            $items.detach().appendTo(this.$('.lcb-rooms-list'));
        },
        filter: function(e) {
            e.preventDefault();
            var $input = $(e.currentTarget),
                needle = $input.val().toLowerCase();
            this.$('.lcb-rooms-list-item').each(function () {
                var haystack = $(this).find('.lcb-rooms-list-item-name').text().toLowerCase();
                $(this).toggle(haystack.indexOf(needle) >= 0);
            });
        },
        addUser: function(user, room) {
            this.$('.lcb-rooms-list-item[data-id="' + room.id + '"]')
                .find('.lcb-rooms-list-users').prepend(this.userTemplate(user.toJSON()));
        },
        removeUser: function(user, room) {
            this.$('.lcb-rooms-list-item[data-id="' + room.id + '"]')
                .find('.lcb-rooms-list-user[data-id="' + user.id + '"]').remove();
        }
    });

    window.LCB.AddPatientView = window.LCB.ModalView.extend({
        initialize: function(options) {
            this.client = options.client;
            this.render();
        },
        submit: function(e) {
            e.preventDefault();
            var $modal = $('#lcb-add-room'),
                $form = this.$(e.target),
                $name = this.$('.lcb-room-name'),
                $slug = this.$('.lcb-room-slug'),
                data = {
                    name: $name.val().trim(),
                    slug: $slug.val().trim(),
                    description: this.$('.lcb-room-description').val(),
                    callback: function success() {
                        $modal.modal('hide');
                        $('#lcb-find-patients').modal('hide');
                        $form.trigger('reset');

                        swal('Patient Added!', 'The patient has been added.', 'success');
                    }
                };

            this.$('.form-group').removeClass('has-error');
            // we require name is non-empty
            if (!data.name) {
                $name.parent().addClass('has-error');
                return;
            }
            // we require slug is non-empty
            if (!data.slug) {
                $slug.parent().addClass('has-error');
                return;
            }
            this.client.events.trigger('rooms:create', data);
        }
    });

    window.LCB.FindProvidersView = Backbone.View.extend({
        events: {
            'keyup .lcb-providers-browser-filter-input': 'filter',
        },
        initialize: function(options) {
            var self = this;
            this.client = options.client;
            this.listenTo(this.collection, 'add', this.addProvider);
            this.$el.on('show.bs.modal', function(){
                self.client.getUsersSync();
            });
        },
        // add: function(provider) {
        //     var room = room.toJSON ? room.toJSON() : room,
        //         context = _.extend(room, {
        //             lastActive: moment(room.lastActive).calendar()
        //         });
        //     this.$('.lcb-rooms-list').append(this.template(context));
        // },
        /*        remove: function(room) {
            this.$('.lcb-providers-list-item[data-id=' + room.id + ']').remove();
        },
        update: function(room) {
            this.$('.lcb-providers-list-item[data-id=' + room.id + '] .lcb-providers-list-item-name').text(room.get('name'));
            this.$('.lcb-providers-list-item[data-id=' + room.id + '] .lcb-providers-list-item-description').text(room.get('description'));
        },*/
        render: function () {
          this.collection.each(this.add);
          return this;
        },
        addProvider: function (item) {
          var providerView = new ProviderView ({ model: item , client : this.client, hideModal: _.bind(this.hide, this)}),
              rendered = providerView.render().el;
          this.$el.find("table>tbody").append(rendered);
        },
        hide: function(){
            this.$el.modal('hide');
        },
        show: function(){
            this.$el.modal('show');
        },
        sort: function(model) {
            var that = this,
                $items = this.$('.lcb-providers-list-item');
            // We only care about other users
            if (this.$el.hasClass('hide') && model && model.id === this.client.user.id)
                return;
            $items.sort(function(a, b){
                var ar = that.providers.get($(a).data('id')),
                    br = that.providers.get($(b).data('id')),
                    au = ar.users.length,
                    bu = br.users.length,
                    aj = ar.get('joined'),
                    bj = br.get('joined')
                if ((aj && bj) || (!aj && !bj)) {
                    if (au > bu) return -1;
                    if (au < bu) return 1;
                }
                if (aj) return -1;
                if (bj) return 1;
                return 0;
            });
            $items.detach().appendTo(this.$('.lcb-providers-list'));
        },
        filter: function(e) {
            e.preventDefault();
            var $input = $(e.currentTarget),
                needle = $input.val().toLowerCase();
            this.$('.lcb-providers-list-item').each(function () {
                var haystack = $(this).find('.lcb-providers-list-item-name').text().toLowerCase();
                $(this).toggle(haystack.indexOf(needle) >= 0);
            });
        },
    });

    var ProviderView = Backbone.View.extend({
        tagName:"tr",
        className : 'lcb-providers-list-item',
        initialize: function(options){
            this.client = options.client;
            this._tmplRender = Handlebars.compile($('#template-provider-browser-item').html());
            this.hideModal = options.hideModal;
        },
        events: {
            "click td": "sendInvite",
        },
        render: function(){
            var innerHTML = this._tmplRender({user:this.model.toJSON()});
            this.el.innerHTML = innerHTML;
            return this;
        },
        sendInvite: function () {
            var username = this.model.get('username')
            var roomId = this.client.rooms.current.get('id');

            //There might be multiple entry box, one message box per room
            var $activedMessageBox = $('.lcb-room:not(.hide) .lcb-entry-input');

            var currentContent = ($activedMessageBox.val() === '' ? '' : $activedMessageBox.val() + ' ');
            $activedMessageBox.val(currentContent +'@' + username + ' ');
            // TODO double check whether we need foucs
            // at least in chrome, focus works,and you can type text diretly even the modal
            // window is on the top, but a little bit wired
            // $activedMessageBox.focus();
            this.client.inviteToRoom(username, roomId);
        }

    });
    window.LCB.InviteNewProviderView = Backbone.View.extend({
        initialize: function(options){
            var self = this;
            this.client = options.client;
            this.parentModal = options.parentModal;
            this.$el.on('show.bs.modal', function(){
                self.parentModal.hide();
            });
            this.$el.on('hide.bs.modal', function(){
                self.parentModal.show();
            });
        },
        events: {
            "click #lcb-invite-new-provider-confirm": "inviteNewProvider",
        },
        inviteNewProvider: function () {
            $.ajax({
                type: "POST",
                url: "/mail/inviteProvider",
                data: {
                    'receiverEmail': $('#lcb-invite-new-provider-email').val(),
                    'message': $('#lcb-invite-new-provider-message').val(),
                    'inviterName': this.client.user.get('displayName'),
                    'inviterOrg': this.client.user.get('organizationName')
                },
                success: function(res){
                    //console.log('invitation mail sent');
                }
            });
        }
    });

}(window, $, _);
