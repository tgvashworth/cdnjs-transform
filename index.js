var _ = require('lodash');
var semver = require('semver');

var tmplt = function (str, o) {
  return str.replace(/{([^{}]*)}/g,
    function (a, b) {
      var r = o[b];
      return typeof r === 'string' || typeof r === 'number' ? r : a;
    }
  );
};


/**
 * some items in CDNJS have filenames as an object,
 * others just have a string
 */
var getFileName = function(package) {
  if (_.isString(package)) return package;
  if (_.isString(package.filename)) return package.filename;
  return package.filename.name;
}

/**
 * Determine if a package is a JS or CSS package
 */
var isJS = function (package) {
  return getFileName(package).match(/\.js$/i);
};
var isCSS = function (package) {
  return getFileName(package).match(/\.css$/i);
};
var isFoldered = function (package) {
  return getFileName(package).match(/\//);
};

var nameMatchesPackageName = function (name, packageName) {
  return name.toLowerCase().indexOf(packageName.toLowerCase()) !== -1;
};

var fileType = function (filename) {
  return filename.match(/min\.js$/i) ? 'minified' : 'default';
};

/**
 * Determine if a package has a filename
 */
var hasFilename = function (package) {
  return 'filename' in package;
};

var extractName = function (filename) {
  return filename.replace(/([.-]min)?\.js$/, '');
};

var processAssetFiles = function (package, memo, asset) {
  return asset.files.reduce(function (memo, filename) {
    filename = _.isString(filename) ? filename : filename.name;

    // Not Javascript? No thanks.
    if (!isJS({ filename: filename })) return memo;
    // In a folder? No thanks. We might support this stuff in future, but right
    // now it's not possible to do reliably.
    if (isFoldered({ filename: filename })) return memo;
    // Grab a name for this asset (no 'min' or file extensions)
    var name = extractName(filename);
    // If the package name isn't in the file name, don't bother. This
    // is a heuristic to make sure we aren't getting dependencies that can't
    // be associated with the libary.
    if (!nameMatchesPackageName(name, extractName(package.name))) return memo;
    // If this is a new package, add the skeleton object
    if (!memo[name]) memo[name] = {
      root: package.name,
      version: package.version,
      files: {
        default: filename
      },
      versions: []
    };
    // If multiple libraries specific the same file, this will throw. Again,
    // this is weird dependency shit.
    if (package.name !== memo[name].root) {
      delete memo[name];
      return memo;
    }
    // Figure out what kind of file this is and add it. This could be extended
    // later for other kinds of files.
    memo[name].files[fileType(filename)] = filename;
    // Save the version associated with the current asset. Versioning ftw.
    memo[name].versions = _.unique(memo[name].versions.concat([asset.version]));
    return memo;
  }, memo);
};

var extractAssets = function (memo, package) {
  return package.assets.reduce(processAssetFiles.bind(null, package), memo);
};

var processPackages =  function (packages) {
  return packages.filter(hasFilename).filter(isJS).reduce(extractAssets, {});
};

module.exports = function (packages) {
  var assets = processPackages(packages);
  return Object.keys(assets).map(function (name) {
    return _.extend(assets[name], {
      name: name
    });
  });
};
