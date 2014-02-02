
/**
 * Module dependencies.
 */
'use strict';

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var startGame = require('./routes/startGame');
var http = require('http');
var path = require('path');
var io = require('socket.io');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

//since we are after app.router this request is probably a 404.
app.use(function(req, res, next){
  res.status(404);
  res.render('404', { url: req.url });
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/start/?', startGame.start);
app.get('/getPuzz', startGame.sendPuzz);

var server =  http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
io = io.listen(server);

startGame.initGame();
io.sockets.on('connection', startGame.sockOnConnection);
