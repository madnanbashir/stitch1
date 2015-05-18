/*
 * CLIENT VIEW
 * The king of all views.
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ClientView = Backbone.View.extend({
        el: '#lcb-client',
        events: {
            'click .lcb-tab': 'toggleSideBar',
            'click .lcb-header-toggle': 'toggleSideBar'
        },
        initialize: function(options) {
            this.client = options.client;
            //
            // Subviews
            //
            // this.browser = new window.LCB.BrowserView({
            //     el: this.$el.find('.lcb-rooms-browser'),
            //     rooms: this.client.rooms,
            //     client: this.client
            // });
            this.tabs = new window.LCB.TabsView({
                el: this.$el.find('.lcb-tabs'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.panes = new window.LCB.PanesView({
                el: this.$el.find('.lcb-panes'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.window = new window.LCB.WindowView({
                rooms: this.client.rooms,
                client: this.client
            });
            this.hotKeys = new window.LCB.HotKeysView({
                rooms: this.client.rooms,
                client: this.client
            });
            this.status = new window.LCB.StatusView({
                el: this.$el.find('.lcb-status-indicators'),
                client: this.client
            });
            this.accountButton = new window.LCB.AccountButtonView({
                el: this.$el.find('.lcb-account-button'),
                model: this.client.user
            });
            this.desktopNotifications = new window.LCB.DesktopNotificationsView({
                rooms: this.client.rooms,
                client: this.client
            });
            if (this.client.options.filesEnabled) {
                this.upload = new window.LCB.UploadView({
                    el: this.$el.find('#lcb-upload'),
                    rooms: this.client.rooms
                });
            }
            //
            // Modals
            //
            this.profileModal = new window.LCB.ProfileModalView({
                el: this.$el.find('#lcb-profile'),
                model: this.client.user
            });
            this.profilePictureModal = new window.LCB.ProfilePictureModalView({
                el: this.$el.find('#lcb-profile-picture'),
                model: this.client.user
            });
            this.accountModal = new window.LCB.AccountModalView({
                el: this.$el.find('#lcb-account'),
                model: this.client.user
            });
            this.tokenModal = new window.LCB.AuthTokensModalView({
                el: this.$el.find('#lcb-tokens')
            });
            this.notificationsModal = new window.LCB.NotificationsModalView({
                el: this.$el.find('#lcb-notifications')
            });
            this.findPatientsModal = new window.LCB.FindPatientsView({
                el: this.$el.find('#lcb-find-patients'),
                rooms: this.client.rooms,
                client: this.client
            });
            this.addPatientModal = new window.LCB.AddPatientView({
                el: this.$el.find('#lcb-add-room'),
                client: this.client
            });
            this.chatHistoryModal = new window.LCB.ChatHistoryView({
                el: this.$el.find('#lcb-chat-history'),
                rooms: this.client.rooms
            });
            this.findProvidersModal = new window.LCB.FindProvidersView({
                el: this.$el.find('#lcb-find-providers'),
                providers: this.client.users,
                client: this.client
            });

            //
            // Misc
            //
            this.client.status.once('change:connected', _.bind(function(status, connected) {
                this.$el.find('.lcb-client-loading').hide(connected);
            }, this));
            return this;
        },
        toggleSideBar: function(e) {
            this.$el.toggleClass('lcb-sidebar-opened');
        }
    });

    window.LCB.AccountButtonView = Backbone.View.extend({
        initialize: function() {
            this.model.on('change', this.update, this);
        },
        update: function(user){
            this.$('.lcb-account-button-username').text('@' + user.get('username'));
            this.$('.lcb-account-button-name').text(user.get('displayName'));
        }
    });


}(window, $, _);
