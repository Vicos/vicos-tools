
/*!
 * Connect - directory
 * Copyright(c) 2011 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 * 
 * forked by Vicos
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , parse = require('url').parse
  , path = require('path')
  , normalize = path.normalize
  , extname = path.extname
  , join = path.join
  , mime = require('express').mime;

/**
 * Directory:
 *
 * Serve directory listings with the given `root` path.
 *
 * Options:
 *
 *  - `hidden` display hidden (dot) files. Defaults to false.
 *  - `icons`  display icons. Defaults to false.
 *  - `filter` Apply this filter function to files. Defaults to false.
 *
 * @param {String} root
 * @param {Object} options
 * @return {Function}
 * @api public
 */

exports = module.exports = function directory(root, options){
  options = options || {};

  // root required
  if (!root) throw new Error('directory() root path required');
  var filter = options.filter
    , root = normalize(root);

  return function directory(req, res, next) {
    if ('GET' != req.method && 'HEAD' != req.method) return next();

    var accept = req.headers.accept || 'text/plain'
      , url = parse(req.url)
      , dir = decodeURIComponent(url.pathname)
      , path = normalize(join(root, dir))
      , originalUrl = parse(req.originalUrl)
      , originalDir = decodeURIComponent(originalUrl.pathname)

    // null byte(s), bad request
    if (~path.indexOf('\0')) return next(400);

    // malicious path, forbidden
    if (0 != path.indexOf(root)) return next(403);

    // check if we have a directory
    fs.stat(path, function(err, stat){
      if (err) return 'ENOENT' == err.code
        ? next()
        : next(err);

      if (!stat.isDirectory()) return next();

      // fetch files
      fs.readdir(path, function(err, files){
        if (err) return next(err);
        files = removeHidden(files, path);
        if (filter) files = files.filter(filter);
        files.sort();

        // content-negotiation
        for (var key in exports) {
          if (~accept.indexOf(key) || ~accept.indexOf('*/*')) {
            exports[key](req, res, files, next, originalDir, path);
            return;
          }
        }

        // not acceptable
        next(406);
      });
    });
  };
};

/**
 * Respond with text/html.
 */

exports.html = function(req, res, filelist, next, dirUri, dirPath){
  var dirs = [ { name: res.app.settings['app name'], uri: '/'} ]; // add root by default
  dirUri.split('/').map(function(dir) { // for each subdir
    if (dir == "") return; // root or some junk with url

    dirs.push({
      name: dir,
      uri: path.join(dirs[dirs.length-1].uri, dir)
    });
  });

  var files = [];
  filelist.map(function(file) {
    files.push({
      name: file,
      uri: path.join(dirUri, file),
      icon: getIcon(path.resolve(dirPath, file))
    });
  });

  res.render('directory', {
    title: dirUri,
    dirs: dirs,
    files: files,
  });
};

/**
 * Respond with application/json.
 */

exports.json = function(req, res, files){
  files = JSON.stringify(files);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', files.length);
  res.end(files);
};

/**
 * Respond with text/plain.
 */

exports.plain = function(req, res, files){
  files = files.join('\n') + '\n';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', files.length);
  res.end(files);
};

function getIcon(file) {
  var icon = null;

  // directory icon
  try {
    stat = fs.statSync(file);
    if (stat.isDirectory())
      icon = '/icons/directory.png';
  }
  catch (e) {}

  // file icon
  if (icon == null)
  {
    var mimetype = mime.lookup(file);
    if (mimetype) {
      var type = mimetype.split('/')[0];
      switch (type) {
        case 'application':
          icon = '/icons/application.png';
          break;
        case 'audio':
          icon = '/icons/audio.png';
          break;
        case 'image':
          icon = '/icons/image.png';
          break;
        case 'text':
          icon = '/icons/text.png';
          break;
        case 'video':
          icon = '/icons/video.png';
          break;
      }
    }
  }

  // default case
  if (icon == null)
    icon = '/icons/default.png';

  return icon;
}

/**
 * Filter "hidden" `files`, aka files
 * beginning with a `.`.
 *
 * @param {Array} files
 * @return {Array}
 * @api private
 */

function removeHidden(files, dirPath) {
  return files.filter(function(file) {
    // remove unaccessible files/dirs
    try {
      stat = fs.statSync(path.resolve(dirPath, file));
    }
    catch (e) {
      return false;
    }

    // remove .* files/dirs
    return '.' != file[0];
  });
}
