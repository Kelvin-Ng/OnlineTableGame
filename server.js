var Array = require('node-array');

var config = require('./config');

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser(config.cookie_secret));

var server = require('http').Server(app);
var io = require('socket.io')(server);
var db = require('mongojs').connect(config.mongo_user + ':' +
					config.mongo_pass + '@' +
					config.mongo_host + ':' +
					config.mongo_port + '/' +
					config.mongo_db_name,
					['users', 'tables']);
var core_logic = require('./core_logic')(db);
var httpHandlers = require('./httpHandlers')(app, core_logic);

server.listen(config.server_port, config.server_host);

io.on('connection', function (socket) {
	console.log('New connection');

	socket.emit('test', 'Welcome');

	socket.on('test', function (data) {
		console.log('Client said: ' + data);
		socket.emit('test', 'You said: ' + data);
	});
});

httpHandlers.register();

