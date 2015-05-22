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
            'keyup #lcb-rooms-browser-filter-input': 'filter',
            'click .lcb-rooms-list-item-row': 'activateRoom'
        },
        initialize: function(options) {
            this.client = options.client;
            this.template = Handlebars.compile($('#template-room-browser-row').html());
            this.rooms = options.rooms;
            this.rooms.on('add', this.add, this);
            this.rooms.on('remove', this.removeRoom, this);
            this.rooms.on('change:name', this.update, this);
            this.rooms.on('change:lastActive', _.debounce(this.updateLastActive, 200), this);
            this.rooms.on('users:add users:remove add remove', this.sort, this);
            this.rooms.current.on('change:id', function(current, id) {
                // We only care about the list pane
                if (id !== 'list') return;
                this.sort();
            }, this);
        },
        activateRoom: function(e) {
            e.preventDefault();
            var $roomRow = $(e.currentTarget),
                id = $roomRow.data('id'),
                room = this.rooms.get(id);
            if (!room) {
                return;
            }
            if(!this.rooms.get(room.id).get('joined')){
                this.client.joinRoom(room.id);
            }
        },
        add: function(room) {
            var room = room.toJSON ? room.toJSON() : room,
                context = _.extend(room, {
                    lastActive: moment(room.lastActive).format('M/D/YYYY')
                });
            this.$('.lcb-rooms-list-modal tbody').append(this.template(context));
        },
        removeRoom: function(room) {
            this.$('.lcb-rooms-list-item-row[data-id=' + room.id + ']').remove();
        },
        update: function(room) {
            this.$('.lcb-rooms-list-item-row[data-id=' + room.id + '] .lcb-rooms-list-item-name-modal').text(room.get('name'));
        },
        updateLastActive: function(room) {
            this.$('.lcb-rooms-list-item-row[data-id=' + room.id + '] .lcb-rooms-list-item-last-active .value').text(moment(room.get('lastActive')).format('M/D/YYYY'));
        },
        sort: function(model) {
            var that = this,
                $items = this.$('.lcb-rooms-list-item-row');
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
            $items.detach().appendTo(this.$('.lcb-rooms-list-modal'));
        },
        filter: function(e) {
            e.preventDefault();
            var $input = $(e.currentTarget),
                needle = $input.val().toLowerCase();
            this.$('.lcb-rooms-list-item-row').each(function () {
                var name = $(this).find('.lcb-rooms-list-item-name-modal').text().toLowerCase();
                var mrn = $(this).find('.lcb-rooms-list-item-name-mrn').text().toLowerCase();
                $(this).toggle(name.indexOf(needle) >= 0 || mrn.indexOf(needle) >= 0 );
            });
        },
        hide: function(){
            this.$el.modal('hide');
        },
        show: function(){
            this.$el.modal('show');
        },
    });

    window.LCB.AddPatientView = window.LCB.ModalView.extend({
        initialize: function(options) {
            var self = this;
            self.client = options.client;
            self.parentModal = options.parentModal;
            self.render();

            self.$el.on('show.bs.modal', function(){
                self.parentModal.hide();
            });
            self.$el.on('hide.bs.modal', function(){
                self.parentModal.show();
            });
        },
        submit: function(e) {
            var self = this;
            e.preventDefault();
            var $modal = this.$el,
                $form = self.$(e.target),
                $name = self.$('.lcb-room-name'),
                $slug = self.$('.lcb-room-slug'),
                data = {
                    name: $name.val().trim(),
                    slug: $slug.val().trim(),
                    description: self.$('.lcb-room-description').val(),
                    callback: function success(resp) {
                        if(!resp.errors){
                            $modal.off('hide.bs.modal'); //Avoid the parentModal display again
                            $modal.modal('hide');
                            $form.trigger('reset');

                            swal('Patient Added!', 'The patient has been added.', 'success');
                        }
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
            'keyup #lcb-providers-browser-filter-input': 'filter',
        },
        initialize: function(options) {
            var self = this;
            this.client = options.client;
            this.listenTo(this.collection, 'add', this.addProvider);
            this.$el.on('show.bs.modal', function(){
                self.client.getUsersSync();
            });
        },
        render: function () {
            this.collection.each(this.add);
            return this;
        },
        addProvider: function (provider) {
            var providerView = new ProviderView ({ model: provider , client : this.client, hideModal: _.bind(this.hide, this)}),
                rendered = providerView.render().el;

                //Item will be added to the list in order of name
                var afterAll = true;
                this.$el.find('.lcb-providers-list-item').each(function(){
                    var name = $(this).find('.lcb-providers-list-item-name').text();
                    if(afterAll && provider.get('displayName') < name){
                        $(this).before(rendered);
                        afterAll = false;
                    }
                })
                if(afterAll){
                     this.$el.find('table>tbody').append(rendered);
                }
        },
        hide: function(){
            this.$el.modal('hide');
        },
        show: function(){
            this.$el.modal('show');
        },
        filter: function(e) {
            e.preventDefault();
            var $input = $(e.currentTarget),
                needle = $input.val().toLowerCase();
            //TODO:We might want to display message while no matched records
            //but i think low priorty, could revisit after new UI mockup implemented
            this.$('.lcb-providers-list-item').each(function () {
                var haystack = $(this).find('.lcb-providers-list-item-name').text().toLowerCase();
                $(this).toggle(haystack.indexOf(needle) >= 0);
            });
        },
    });
    /**
     * A private view only used for each provider record in provider list, no need to expose it to public
     */
    var ProviderView = Backbone.View.extend({
        tagName:"tr",
        className : 'lcb-providers-list-item',
        initialize: function(options){
            this.client = options.client;
            this._tmplRender = Handlebars.compile($('#template-provider-browser-item').html());
            this.hideModal = options.hideModal;
            this.listenTo(this.model, 'change:name', this.updateProvider);
        },
        events: {
            "click td": "sendInvite",
        },
        render: function(){
            var innerHTML = this._tmplRender({user:this.model.toJSON()});
            this.el.innerHTML = innerHTML;
            return this;
        },
        //TODO, Not sure whether proivder profile update will be broadcast real time
        //Implement and test this after the profile update function back to normal
        updateProvider:function(provider){
            console.log(provider);
        },
        sendInvite: function () {
            var username = this.model.get('username')
            var roomId = this.client.rooms.current.get('id');

            //There might be multiple entry box, one message box per room
            var $activedMessageBox = $('.lcb-room:not(.hide) .lcb-entry-input');

            var currentContent = ($activedMessageBox.val() === '' ? '' : $activedMessageBox.val() + ' ');
            $activedMessageBox.val(currentContent +'@' + username + ' ');

            $activedMessageBox.focus();
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
