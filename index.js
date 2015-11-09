var fs              = require("fs"),
    config          = require("./config.js"),
    httpServ        = require('https'),
    app             = createSecureApp(httpServ, config),
    WebSocketServer = require('ws').Server,
    wss             = new WebSocketServer({server: app});

wss.on('connection', function(ws) {
    var broadcast = function(message) {
        log("BROADCAST", message);
        wss.clients.forEach(function each(client) {
            client.send(message);
        });

        return message;
    };

    ws.on('message', function(message) { log("WS-EVENT-MESSAGE", broadcast(message)); });
    ws.on('close',   function(message) { log("WS-EVENT-CLOSE",   broadcast(message)); });
    ws.send('You are connected!');
});

function createSecureApp(httpServ, config) {
    var processRequest = function(req, res) {
        console.log("Request received.")
    };

    return httpServ.createServer({
        key: fs.readFileSync(config.ssl_key),
        cert: fs.readFileSync(config.ssl_cert)
    }, processRequest).listen(config.port);
}

function log(method, message) {
    console.log('%s|%s|%s', new Date(), method, message);
}
