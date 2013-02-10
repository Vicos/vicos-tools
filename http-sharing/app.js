
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , conf = require('./conf')
  , directory = require('./directory');

var app = express();

app.configure(function(){
  var oneMonth = 2592000000;

  app.set('app name', 'http-sharing');
  app.set('port', conf.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('shared dirs', conf.sharedDirs);
  
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public'), { maxAge: oneMonth }));
  app.use(directory(path.join(__dirname, 'public')));
  
  for (var i in conf.sharedDirs) {
    app.use('/shared/'+conf.sharedDirs[i].name, express.static(conf.sharedDirs[i].path));
    app.use('/shared/'+conf.sharedDirs[i].name, directory(conf.sharedDirs[i].path));
  }
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

app.get('/shared', function(req, res){
  res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
