const App     = require('utils/sanaAppInstance');
const Config  = require('utils/config');
const request = require('superagent-bluebird-promise');
const Session = require('models/session');
const Storage = require('utils/storage');


module.exports = function() {
    this.publish = function(protocol) {
        protocol.generate(function onSuccess(xmlContent, status, jqXHR) {
            let url = Config.HUB_API_URL + '/protocols';
            let storage = new Storage();
            let xmlString = xmlContent.xml ? xmlContent.xml : (new XMLSerializer()).serializeToString(xmlContent);
            request.post(url)
                .set(
                    'Authorization',
                    storage.read(Session.AUTH_TOKEN_KEY)[Session.AUTH_TOKEN_KEY])
                .send({
                    id: protocol.id,
                    title: protocol.attributes.title,
                    content: xmlString,
                })
                .then(function() {
                    App().RootView.showNotification({
                        alertType: 'success',
                        title: 'Sucessfully published procedure',
                        desc: '',
                    });
                })
                .catch(function() {
                  App().RootView.showNotification({
                      title: 'Failed to publish procedure',
                  });
                });
        }, function onError(jqXHR, textStatus, errorThrown) {
            console.warn('Failed to generate Procedure', textStatus);
            App().RootView.showNotification({
                title: 'Failed to generate XML for procedure. Make sure it is valid.',
            });
        });
    };
};
