var fs    = require("fs"),
    config = require("./config.js");

var processRequest = function(req, res) {
    console.log("Request received.")
};

var httpServ = require('https');
var app = httpServ.createServer({
    key: fs.readFileSync(config.ssl_key),
    cert: fs.readFileSync(config.ssl_cert)
}, processRequest).listen(config.port);

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({server: app});
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: %s', message);
        wss.clients.forEach(function each(client) {
          client.send(message);
        });
    });
    ws.on('close', function(code, message) {
        console.log('close: %s', message);
        wss.clients.forEach(function each(client) {
            client.send("Close connection");
        });
    });
    ws.send('Connected!');
});

