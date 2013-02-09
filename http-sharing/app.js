
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

var sharedDirs = [
    { name: 'docs', path: 'D:/Users/Florent' },
    { name: 'visdur2', path: 'E:/' },
];

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('shared dirs', sharedDirs);
  
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.directory(path.join(__dirname, 'public')));
  
  for (var i in sharedDirs) {
    app.use('/shared/'+sharedDirs[i].name, express.static(sharedDirs[i].path));
    app.use('/shared/'+sharedDirs[i].name, express.directory(sharedDirs[i].path));
  }
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
