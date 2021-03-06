const Config = require('utils/config');
const cookieStorage = require('mozilla-doc-cookies');


module.exports = function() {

    this.backend = cookieStorage;
    this.isPersistent = true;
    this.cookieExpiryTime = Infinity;
    this.path = '/';
    this.domain = Config.COOKIE_DOMAIN;

    // Check if we have something stored in sessionStorage
    // If so, then we were using sessionStorage since last page refresh
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
        let key = sessionStorage.key(i);
        if (key.substr(0, Config.APP_NAMESPACE.length) === Config.APP_NAMESPACE) {
            this.backend = sessionStorage;
            this.isPersistent = false;
            break;
        }
    }

    this.read = function (key) {
        const KEY = Config.SANA_NAMESPACE + '_' + key;
        return JSON.parse(this.backend.getItem(KEY));
    };

    this.write = function(key, obj) {
        const KEY = Config.SANA_NAMESPACE + '_' + key;
        if (this.backend === cookieStorage) {
            this.backend.setItem(KEY, JSON.stringify(obj), this.cookieExpiryTime, this.path, this.domain);
        } else {
            this.backend.setItem(KEY, JSON.stringify(obj));
        }
    };

    this.delete = function(key) {
        const KEY = Config.SANA_NAMESPACE + '_' + key;
        if (this.backend === cookieStorage) {
            this.backend.removeItem(KEY, this.path, this.domain);
        } else {
            this.backend.removeItem(KEY);
        }
    };

    this.changeExpiryTime = function(expTime) {
        this.cookieExpiryTime = expTime;
    };

    this.changeEngine = function(newBackend, isPersistent) {
        let oldBackend = this.backend;

        for (let i = oldBackend.length - 1; i >= 0; i--) {
            let key = oldBackend.key(i);

            if (key.substr(0, Config.APP_NAMESPACE.length) === Config.APP_NAMESPACE) {
                let value = oldBackend.getItem(key);
                oldBackend.removeItem(key);
                newBackend.setItem(key, value);
            }
        }

        this.backend = newBackend;
        this.isPersistent = isPersistent;
    };

};
