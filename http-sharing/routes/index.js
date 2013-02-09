
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {
  	title: 'http-sharing',
  	sharedDirs: res.app.settings['shared dirs'],
  });
};