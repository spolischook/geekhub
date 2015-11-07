var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8080});
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: %s', message);
        wss.clients.forEach(function each(client) {
          client.send(message);
        });
    });
    ws.send('Connected!');
});

