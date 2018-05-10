const path = require('path');
const chalk = require('chalk');
const { flowRight: compose } = require('lodash');
const fs = require('fs');
const mkdirp = require('mkdirp');
const concat = require('concat-files');

const BASE_PACKAGE = require('../package.json');
const PACKAGE_NAME = process.env.npm_package_name;
const BIN = path.resolve('./node_modules/.bin');
const SOURCE_DIR = path.resolve('./src');
const OUT_DIR = path.resolve('./dist');
const TMP_DIR = path.resolve('./tmp');
const LIB_DIR = 'lib';
const BASE_DIR = path.resolve('./');

const consoleLog = console.log.bind(console); // eslint-disable-line no-console
const log = compose(consoleLog, chalk.bold);
const logSuccess = compose(consoleLog, chalk.green.bold);
const logError = compose(consoleLog, chalk.red.bold);

const readDir = (dirPath, full=false) => new Promise((resolve, reject) => fs.readdir(dirPath, (err, dirs) => err? reject(err): resolve(full? dirs.map((fileName) => path.join(dirPath, fileName)): dirs)));
const concatFiles = (files, destination) => new Promise((resolve, reject) => concat(files, destination, (err) => err? reject(err): resolve()));
const makeDir = (dirPath) => new Promise((resolve, reject) => mkdirp(dirPath, (err, dirs) => err? reject(err): resolve(dirs)));
const writeToFile = (filePath, content) => new Promise((resolve, reject) => fs.writeFile(filePath, content, {}, (err) => err? reject(err): resolve()));

module.exports = {
  BASE_PACKAGE,
  PACKAGE_NAME,
  BIN,
  SOURCE_DIR,
  OUT_DIR,
  TMP_DIR,
  LIB_DIR,
  BASE_DIR,
  log,
  logSuccess,
  logError,
  writeToFile,
  readDir,
  concatFiles,
  makeDir,
};
