
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
  var root = normalize(root);

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
      fs.readdir(path, function(err, filenames){
        if (err) return next(err);
        filelist = getFilelist(path, filenames)

        // content-negotiation
        for (var key in exports) {
          if (~accept.indexOf(key) || ~accept.indexOf('*/*')) {
            exports[key](req, res, filelist, next, originalDir, path);
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

  var files = filelist.map( function(file) {
    return({
      name: file.name,
      uri: path.join(dirUri, file.name),
      icon: getIcon(file)
    });
  });

  res.render('directory', {
    title: dirUri,
    dirs: dirs,
    files: files,
  });
};

exports.json = function(req, res, files){
/*  files = JSON.stringify(files);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', files.length);
  res.end(files);
  */
  return; // unimplemented yet
};

exports.plain = function(req, res, files){
/*  files = files.join('\n') + '\n';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', files.length);
  res.end(files);
  */
  return; // unimplemented yet
};

function getIcon(file) {
  var icon = null;

  if (file.isDir)
    return '/icons/directory.png'

  if (file.mime)
  {
    var type = file.mime.split('/')[0];
    switch (type) {
      case 'application':
        return '/icons/application.png';
      case 'audio':
        return '/icons/audio.png';
      case 'image':
        return '/icons/image.png';
      case 'text':
        return '/icons/text.png';
      case 'video':
        return '/icons/video.png';
    }
  }

  return '/icons/default.png';
}

function getFilelist(dirpath, filenames) {
  var filelist = filenames.map( function(filename) {
    try {
      var filepath = path.resolve(dirpath, filename)
      var stat = fs.statSync(filepath);

      return({
        name: filename,
        path: filepath,
        isDir: stat.isDirectory(),
        mime: stat.isDirectory() ? null : mime.lookup(filepath)
      });
    }
    catch (e) {
      return null;
    }
  });
  filelist = filelist.filter( function(file) { return (!!file); });

  filelist.sort( function(a, b) {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return (a.name).localeCompare(b.name);
  });

  return filelist;
}
