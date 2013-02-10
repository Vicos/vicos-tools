
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , conf = require('./conf');

var app = express();

app.configure(function(){
  app.set('port', conf.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('shared dirs', conf.sharedDirs);
  
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.directory(path.join(__dirname, 'public')));
  
  for (var i in conf.sharedDirs) {
    app.use('/shared/'+conf.sharedDirs[i].name, express.static(conf.sharedDirs[i].path));
    app.use('/shared/'+conf.sharedDirs[i].name, express.directory(conf.sharedDirs[i].path));
  }
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
