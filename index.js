var fs              = require("fs"),
    ini             = require('ini'),
    config          = ini.parse(fs.readFileSync('config.ini', 'utf8')),
    httpServ        = require('https'),
    app             = createSecureApp(httpServ, config),
    WebSocketServer = require('ws').Server,
    MongoClient     = require('mongodb').MongoClient,
    dbUrl           = 'mongodb://localhost:27017/'+config.db,
    assert          = require('assert'),
    wss             = new WebSocketServer({server: app, verifyClient: authenticate});

wss.on('connection', function(ws) {
    var user,
        token = getToken(ws.upgradeReq);

    MongoClient.connect(dbUrl, function(err, db) {
        assert.equal(null, err);
        var collection = db.collection('users');

        collection.find({token: token}).limit(1).toArray(function(err, docs) {
            assert.equal(err, null);
            user = docs.shift();

            ws.on('message', function(message) { log(user, "WS-EVENT-MESSAGE", broadcast(user, message)); });
            ws.on('close',   function(message) { log(user, "WS-EVENT-CLOSE",   broadcast(user, message)); });
        });
    });

    var broadcast = function(user, text) {
        var message = {user: user, dateTime: new Date(), text: text};

        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(message));
        });

        return message.text;
    };
});

function authenticate(info, cb) {
    var token = getToken(info.req);

    if (!token) {
        cb(false, 401);
        return;
    }

    MongoClient.connect(dbUrl, function(err, db) {
        assert.equal(null, err);
        var collection = db.collection('users');

        collection.find({token: token}).limit(1).toArray(function(err, docs) {
            assert.equal(err, null);
            var user = docs.shift();

            if (!user) {
                cb(false, 401);
            } else {
                cb(true);
            }
        });
    });

}

function getToken(req) {
    var cookies = parseCookies(req);

    return cookies.token
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function createSecureApp(httpServ, config) {
    var processRequest = function(req, res) {
        console.log("Request received.")
    };

    return httpServ.createServer({
        key: fs.readFileSync(config.ssl_key),
        cert: fs.readFileSync(config.ssl_cert)
    }, processRequest).listen(config.port);
}

function log(user, method, message) {
    console.log('%s|%s|%s|%s', new Date(), method, user.login, message);
}

var rand = function() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

var token = function() {
    return rand() + rand(); // to make it longer
};
