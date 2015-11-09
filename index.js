var fs    = require("fs"),
    config = require("./config.js"),
    httpServ = require('https'),
    app = createSecureApp(httpServ, config),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({server: app});

wss.on('connection', function(ws) {
    var broadcast = function(message) {
        console.log('received: %s', message);
        wss.clients.forEach(function each(client) {
            client.send(message);
        });
    };

    ws.on('message', broadcast);
    ws.on('close', function(code, message) {
        console.log('close: %s', message);
        wss.clients.forEach(function each(client) {
            client.send("Close connection");
        });
    });
    ws.send('Connected!');
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
