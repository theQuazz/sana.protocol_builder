let RootView = require('views/root_view');

let AuthenticationForm = require('behaviors/auth_form_behavior');
let SortableCollection = require('behaviors/sortable_collection_behavior');

let AuthRouter = require('routers/auth/auth_router');
let InfoRouter = require('routers/info/info_router');
let ProceduresRouter = require('routers/procedures/procedures_router');

let SessionModel = require('models/session.js');
let Helpers = require('utils/helpers');
let Storage = require('utils/storage');


module.exports = Marionette.Application.extend({

    init: function() {
        this._setup_authentication();
        this._setup_views();
        this._setup_history();

        this._load_behaviors();
        this._load_routers();
    },

    onStart: function () {
        Backbone.history.start({ pushState: true });

        // Do this after Backbone.history has started so the navigate will work
        if (!this.session.isValid()) {
            console.info("Started with invalid session");
            this.session.destroy();
            if (Helpers.current_page_require_authentication()) {
                Helpers.goto_default_logged_out();
            }
        }
    },

    _setup_authentication: function() {
        var self = this;

        // When Backbone.sync hits an 401, then it means the user token is 
        // no longer valid and they need to relog in
        var sync = Backbone.sync;
        Backbone.sync = function(method, model, options) {
            var errorHandler = options.error;
            options.error = function(xhr, ajaxOptions, thrownError) {
                if (xhr.status === 401) {
                    // Reloads the page (i.e. resets the App state)
                    // TODO present user with error message
                    self.session.destroy();
                } else {
                    console.warn('Cannot globally handle Backbone.sync error; delegating to event handlers if any.');
                    errorHandler(xhr, ajaxOptions, thrownError);
                }
            };
            sync(method, model, options);
        };

        // Setup storage mechanism
        this.storage = new Storage();

        // Setup session
        // After logging in/out, the Session model will trigger the change:auth_token event
        this.session = new SessionModel({ storage: this.storage });
        this.session.on('change:' + SessionModel.AUTH_TOKEN_KEY, function() {
            var has_token = self.session.has(SessionModel.AUTH_TOKEN_KEY);
            console.info('Auth Token Changed: ' + has_token);

            if (has_token) {
                Helpers.goto_default_logged_in();
            } else {
                Helpers.goto_default_logged_out();
            }
        });

        $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
            options.url = Config.API_BASE + options.url;

            if (self.session.has(SessionModel.AUTH_TOKEN_KEY)) {
                jqXHR.setRequestHeader('Authorization', 'Token ' + self.session.get(SessionModel.AUTH_TOKEN_KEY));
            }
        });

        // Load any existing tokens
        // Do this before Backbone.history has started so that the model change
        // events don't redirect the user yet
        this.session.fetch();
    },

    _setup_views: function() {
        var self = this;

        // Assign root view for modules to render in
        this.root_view = new RootView();

        this.session.on('request', function() {
            self.root_view.show_spinner();
        });
        this.session.on('complete', function() {
            self.root_view.hide_spinner();
        });
    },

    _setup_history: function() {
        let self = this;
        let ROUTE_NOT_FOUND_EVENT = 'route-not-found';

        let History = Backbone.History.extend({
            loadUrl: function() {
                let match = Backbone.History.prototype.loadUrl.apply(this, arguments);
                if (!match) {
                    this.trigger(ROUTE_NOT_FOUND_EVENT);
                }
                return match;
            }
        });

        Backbone.history = new History();
        Backbone.history.on(ROUTE_NOT_FOUND_EVENT, function() {
            self.info_router.controller.e404_not_found();
        });
    },

    _load_behaviors: function() {
        var self = this;

        // Load behaviours
        Marionette.Behaviors.behaviorsLookup = function() {
            return self.Behaviors;
        };
        this.Behaviors = {};
        this.Behaviors.AuthenticationForm = AuthenticationForm;
        this.Behaviors.SortableCollection = SortableCollection;
    },

    _load_routers: function() {
        this.auth_router = new AuthRouter({ app: this });
        this.procedure_router = new ProceduresRouter({ app: this });
        this.info_router = new InfoRouter({ app: this });
    },

});
