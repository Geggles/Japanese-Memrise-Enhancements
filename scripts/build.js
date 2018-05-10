const rollup = require('rollup');
const { cp } = require('shelljs');
const del = require('del');
const path = require('path');
const {
  BASE_DIR,
  SOURCE_DIR,
  OUT_DIR,
  TMP_DIR,
  logError,
  writeToFile,
  readDir,
  concatFiles,
  makeDir,
} = require('./util');

// TODO: make the promise chain break on error

const importsPath = path.join(TMP_DIR, 'import');
const featuresPathIn = path.join(SOURCE_DIR, 'features');
const featuresPathOut = path.join(TMP_DIR, 'features');
const communicationPathIn = path.join(SOURCE_DIR, 'others', 'communication.js');
const communicationPathOut = path.join(TMP_DIR, 'communication');
const optionsPathIn = path.join(SOURCE_DIR, 'options');
const optionsPathOut = path.join(TMP_DIR, 'options');
const concatenationPath = path.join(TMP_DIR, 'concat');
const pathOut = path.join(TMP_DIR, 'out');
const injectablesPath = path.join(TMP_DIR, 'injectables.js');

const makeBundle = (rollupOptions, name) =>
  rollup.rollup(rollupOptions).catch((err) =>
    logError(name === undefined? 'Could not create nameless bundle.':
                                 `Could not create bundle called '${name}'.`, err));

const writeBundle = (writeOptions, name) =>
  (bundle) => bundle.write(writeOptions).catch((err) =>
    logError(name === undefined? 'Could not write nameless bundle.':
                                 `Could not write bundle called '${name}'.`, err));

const generateBundle = (generateOptions, name) =>
  (bundle) => bundle.generate(generateOptions).catch((err) =>
    logError(name === undefined? 'Could not generate nameless bundle.':
                                 `Could not generate bundle called '${name}'.`, err));

const compileComponents = (componentType, externalModules) => {
  externalModules = Object.assign({}, externalModules);

  const compile = (componentPathIn, inputPath, outputPath, name, index) => {
    const makeNamedBundle = (...args) => makeBundle(...args, name);
    const writeNamedBundle = (...args) => writeBundle(...args, name);

    const importedModules = {};

    return makeNamedBundle({
      input: inputPath,
      external(id, parent) {
        // we do not want the module id to stay as a relative path
        if (!path.isAbsolute(id)) return false;
        // we can't resolve the module itself
        if (parent === undefined) return false;
        // if the module is local, replace the import by its content
        if (path.normalize(path.dirname(id)) === path.normalize(path.dirname(parent))) return false;

        importedModules[id] = (() => {
          // module has already been imported elsewhere
          if (id in externalModules) return externalModules[id];
          return externalModules[id] = `module${Object.keys(externalModules).length}`;
        })();
        return true;
      },
    }).then(writeNamedBundle({
      format: 'iife',
      file: outputPath,
      // 0 is reserved for options
      intro: `const channel = newChannel(${JSON.stringify((index+1).toString())});`,
      globals: importedModules,
    }));
  };

  const promisePromise = readDir(featuresPathIn)
    .catch((err) => logError('Could not read feature files.', err))
    .then((components) => components
      .map((component, index) => compile(
        path.join(featuresPathIn, component),
        path.join(featuresPathIn, component, `${componentType}.js`),
        path.join(featuresPathOut, component, `${componentType}.js`),
        component,
        index
      )));

  return promisePromise
    .then((promises) => Promise.all(promises))
    .then(() => externalModules);
};

const compileContentComponents = (externalModules) => compileComponents('content', externalModules);
const compileInjectableComponents = (externalModules) => compileComponents('inject', externalModules);

const compileBackground = () => {
  const makeNamedBundle = (...args) => makeBundle(...args, 'background');
  const writeNamedBundle = (...args) => writeBundle(...args, 'background');
  // todo: generalise structure
  return makeDir(pathOut)
    .catch((err) => logError(`Could not create out directory at ${pathOut}.`, err))
    .then(() => makeNamedBundle({
      input: path.join(SOURCE_DIR, 'options', 'background.js'),
    }))
    .then(writeNamedBundle({
      format: 'iife',
      file: path.join(pathOut, 'background.js'),
    }));
};

const compileOptions = (componentType, externalModules) => {
  const makeNamedBundle = (...args) => makeBundle(...args, 'options');
  const writeNamedBundle = (...args) => writeBundle(...args, 'options');

  const optionsPathInput = path.join(optionsPathIn, `${componentType}.js`);
  const optionsPathOutput = path.join(optionsPathOut, `${componentType}.js`);

  const extMods = Object.assign({}, externalModules);
  const importedModules = {};

  return makeNamedBundle({
    input: optionsPathInput,
    // make note of the imported modules
    external: (id) => {
      // the first 'imported' module is the module itself
      if (id === optionsPathInput) return false;
      if (!path.isAbsolute(id)) return true;

      const modulePath = path.resolve(communicationPathIn, id);
      let moduleName = extMods[modulePath];

      if (moduleName === undefined) {
        moduleName = `module${Object.keys(extMods).length}`;
        extMods[modulePath] = moduleName;
      }

      importedModules[modulePath] = moduleName;
      // these modules should stay external, as we will collect them later
      return true;
    },
  }).then(writeNamedBundle({
    format: 'iife',
    file: optionsPathOutput,
    globals: importedModules,
    name: 'optionsReady',
    intro: 'const channel = newChannel("0");',
  })).then(() => extMods);
};

const compileCommunication = (componentType, externalModules) => {
  const makeNamedBundle = (...args) => makeBundle(...args, 'communication');
  const writeNamedBundle = (...args) => writeBundle(...args, 'communication');

  const communicationPathOutput = path.join(communicationPathOut, `${componentType}.js`);

  const extMods = Object.assign({}, externalModules);
  const importedModules = {};

  return makeNamedBundle({
    input: communicationPathIn,
    // make note of the imported modules
    external: (id) => {
      // the first 'imported' module is the module itself
      if (id === communicationPathIn) return false;
      // after the relative import, the absolute path will be queried
      if (!path.isAbsolute(id)) return true;

      const modulePath = path.resolve(communicationPathIn, id);
      let moduleName = extMods[modulePath];

      if (moduleName === undefined) {
        moduleName = `module${Object.keys(extMods).length}`;
        extMods[modulePath] = moduleName;
      }

      importedModules[modulePath] = moduleName;
      return true;
    },
  }).then(writeNamedBundle({
    format: 'iife',
    file: communicationPathOutput,
    globals: importedModules,
    name: 'newChannel',
    intro: `const side = ${JSON.stringify(componentType)};`,
  })).then(() => extMods);
};

const compileInjectables = (externalModules) => {
  const makeNamedBundle = (...args) => makeBundle(...args, 'inject');
  const generateNamedBundle = (...args) => generateBundle(...args, 'inject');

  const injectImportsPath = path.join(importsPath, 'inject.js');
  const injectCommunicationPathOut = path.join(communicationPathOut, 'inject.js');
  const injectPathOut = path.join(pathOut, 'inject.js');
  const injectConcatenationPath = path.join(concatenationPath, 'inject.js');

  const injectImports = Object.entries(externalModules)
    .map(([moduleName, alias]) => `import * as ${alias} from ${JSON.stringify(moduleName.replace(/\\/g, '/'))};`)
    .join('');

  return makeDir(importsPath)
    .catch((err) => logError(`Could not create imports directory at ${importsPath}.`, err))
    .then(() => writeToFile(injectImportsPath, injectImports))
    .catch((err) => logError(`Could not write content imports to ${injectImportsPath}.`, err))
    .then(() => makeDir(concatenationPath))
    .catch((err) => logError(`Could not create concatenation directory at ${concatenationPath}.`, err))
    .then(() => readDir(featuresPathOut, true))
    .catch((err) => logError(`Could not read feature output directory at ${featuresPathOut}.`, err))
    .then((files) => concatFiles([
      injectImportsPath,
      injectCommunicationPathOut,
      path.join(optionsPathOut, 'inject.js'),
    ]
      .concat(files.map((file) => path.join(file, 'inject.js'))), injectConcatenationPath))
    .catch((err) => logError('Could not concat files', err))
    .then(() => makeNamedBundle({
      input: injectConcatenationPath,
    }))
    .then(generateNamedBundle({
      format: 'iife',
      file: injectPathOut,
      name: 'inject',
    }))
    .then(({ code, map: sourceMap }) => code);
};

const compileContents = (injectables, externalModules) => {
  const makeNamedBundle = (...args) => makeBundle(...args, 'content');
  const writeNamedBundle = (...args) => writeBundle(...args, 'content');

  const contentImportsPath = path.join(importsPath, 'content.js');
  const contentCommunicationPathOut = path.join(communicationPathOut, 'content.js');
  const contentPathOut = path.join(pathOut, 'content.js');
  const contentConcatenationPath = path.join(concatenationPath, 'content.js');

  const contentImports = Object.entries(externalModules)
    .map(([moduleName, alias]) => `import * as ${alias} from ${JSON.stringify(moduleName.replace(/\\/g, '/'))};`)
    .join('');

  const injectString = `
    const scriptElement = document.createElement('script');
    scriptElement.textContent = ${JSON.stringify(injectables)};
    const parent = (document.head || document.documentElement);
    parent.appendChild(scriptElement);
  `;

  return makeDir(importsPath)
    .catch((err) => logError(`Could not create imports directory at ${importsPath}.`, err))
    .then(() => writeToFile(contentImportsPath, contentImports))
    .catch((err) => logError(`Could not write content imports to ${contentImportsPath}.`, err))
    .then(() => makeDir(concatenationPath))
    .catch((err) => logError(`Could not create concatenation directory at ${concatenationPath}.`, err))
    .then(() => writeToFile(injectablesPath, injectString))
    .catch((err) => logError(`Could not write injectables to ${injectablesPath}.`, err))
    .then(() => readDir(featuresPathOut, true))
    .catch((err) => logError(`Could not read feature output directory at ${featuresPathOut}.`, err))
    .then((files) => concatFiles([
      contentImportsPath,
      contentCommunicationPathOut,
      path.join(optionsPathOut, 'content.js'),
    ]
      .concat(files.map((file) => path.join(file, 'content.js')))
      .concat([injectablesPath]), contentConcatenationPath))
    .catch((err) => logError('Could not concat files', err))
    .then(() => makeNamedBundle({
      input: contentConcatenationPath,
    }))
    .then(writeNamedBundle({
      format: 'iife',
      file: contentPathOut,
      name: 'content',
    }));
};

function refreshOutdir() {
  return del(path.join(OUT_DIR, '**')).then(() => makeDir(OUT_DIR));
}

function refreshTmpdir() {
  return del(path.join(TMP_DIR, '**')).then(() => makeDir(TMP_DIR));
}

async function bla() {
  await refreshTmpdir();
  await refreshOutdir();

  const injectablesPromise = compileInjectableComponents()
    .then((externalModules) => compileCommunication('inject', externalModules))
    .then((externalModules) => compileOptions('inject', externalModules))
    .then((externalModules) => compileInjectables(externalModules));

  const contentPromise = compileContentComponents()
    .then((externalModules) => compileOptions('content', externalModules))
    .then((externalModules) => compileCommunication('content', externalModules));

  const contentCompletePromise = Promise.all([
    injectablesPromise,
    contentPromise,
  ]).then(([code, externalModules]) => compileContents(code, externalModules));

  const backgroundPromise = compileBackground();

  const copyPromise = makeDir(OUT_DIR).then(() => Promise.all([
    cp('-R', path.join(SOURCE_DIR, 'options_custom'), path.join(OUT_DIR, 'options_custom')),
    cp('-R', path.join(SOURCE_DIR, 'page_action'), path.join(OUT_DIR, 'page_action')),
  ]));

  const outputPromise = Promise.all([
    contentCompletePromise,
    backgroundPromise,
  ]).then(() => makeDir(OUT_DIR))
    .then(() => cp([
      path.join(pathOut, 'background.js'),
      path.join(pathOut, 'content.js'),
    ], OUT_DIR));

  const manifestPromise = makeDir(OUT_DIR).then(() => cp(path.join(BASE_DIR, 'manifest.json'), OUT_DIR));

  return Promise.all([
    copyPromise,
    outputPromise,
    manifestPromise,
  ]);
}

bla();
