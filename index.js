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
 * Determine if a package is a JS or CSS package
 */
var isJS = function (package) {
  return package.filename.match(/\.js$/i);
};
var isCSS = function (package) {
  return package.filename.match(/\.css$/i);
};
var isFoldered = function (package) {
  return package.filename.match(/\//);
};

var nameMatchesPackageName = function (name, packageName) {
  return name.indexOf(packageName) !== -1;
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
  return filename.replace(/([.-]min)?\.js$/, '')
};

var processAssetFiles = function (package, memo, asset) {
  // Don't allow invalidly semver'd packages in
  if (!semver.valid(asset.version)) return memo;
  return asset.files.reduce(function (memo, filename) {
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
      files: {
        default: filename
      },
      versions: []
    };
    // If multiple libraries specific the same file, this will throw. Again,
    // this is weird dependency shit.
    if (package.name !== memo[name].root) {
      throw new Error(tmplt("Conflicted '{asset}'. '{package}' != '{root}'.", {
        asset: filename,
        package: package.name,
        root: memo[name].root
      }));
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

module.exports = function (packages) {
  return packages.filter(hasFilename).filter(isJS).reduce(extractAssets, {});
};