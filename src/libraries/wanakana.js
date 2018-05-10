function applyMapping(string, mapping, convertEnding) {
  const root = mapping;

  function nextSubtree(tree, nextChar) {
    const subtree = tree[nextChar];
    if (subtree === undefined) {
      return undefined;
    }
    // if the next child node does not have a node value, set its node value to the input
    return Object.assign({ '': tree[''] + nextChar }, tree[nextChar]);
  }

  function newChunk(remaining, currentCursor) {
    // start parsing a new chunk
    const firstChar = remaining.charAt(0);
    return parse(
      Object.assign({ '': firstChar }, root[firstChar]),
      remaining.slice(1),
      currentCursor,
      currentCursor + 1
    );
  }

  function parse(tree, remaining, lastCursor, currentCursor) {
    if (!remaining) {
      if (convertEnding || Object.keys(tree).length === 1) {
        // nothing more to consume, just commit the last chunk and return it
        // so as to not have an empty element at the end of the result
        return tree[''] ? [[lastCursor, currentCursor, tree['']]] : [];
      }
      // if we don't want to convert the ending, because there are still possible continuations left, just return null as the final node value
      return [[lastCursor, currentCursor, null]];
    }

    if (Object.keys(tree).length === 1) {
      return [[lastCursor, currentCursor, tree['']]].concat(
        newChunk(remaining, currentCursor)
      );
    }

    const subtree = nextSubtree(tree, remaining.charAt(0));
    if (subtree === undefined) {
      return [[lastCursor, currentCursor, tree['']]].concat(
        newChunk(remaining, currentCursor)
      );
    }

    // continue current branch
    return parse(subtree, remaining.slice(1), lastCursor, currentCursor + 1);
  }
  return newChunk(string, 0);
}

// transform the tree, so that for example hepburnTree['ゔ']['ぁ'][''] === 'va'
// or kanaTree['k']['y']['a'][''] === 'きゃ'
function transform(tree) {
  const result = {};
  for (const [char, subtree] of Object.entries(tree)) {
    if (typeof subtree === 'string') {
      // we have reached the bottom of this branch
      result[char] = { '': subtree };
    } else {
      // more subtrees to go through
      result[char] = transform(subtree);
    }
  }
  return result;
}

function getSubTreeOf(tree, string) {
  let correctSubTree = tree;
  for (const char of string) {
    if (correctSubTree[char] === undefined) {
      correctSubTree[char] = {};
    }
    correctSubTree = correctSubTree[char];
  }
  return correctSubTree;
}

/**
 * creates a mapping tree, returns a function to accept a defaultMap to then merge with
 * (customMap) => (defaultMap) => mergedMap
 * @param  {Object} customMap { 'ka' : 'な' }
 * @return {Function} (defaultMap) => mergedMap
 * @example
 * const sillyMap = createCustomMapping({ 'ちゃ': 'time', '茎': 'cookie'　});
 * // sillyMap is passed defaultMapping to merge with when called in toRomaji()
 * toRomaji("It's 茎 ちゃ よ", { customRomajiMapping: sillyMap });
 * // => 'It's cookie time yo';
 */
function createCustomMapping(customMap = {}) {
  const customTree = {};
  for (const [rom, kan] of Object.entries(customMap)) {
    let subTree = customTree;
    for (const char of rom) {
      if (subTree[char] === undefined) {
        subTree[char] = {};
      }
      subTree = subTree[char];
    }
    subTree[''] = kan;
  }

  return function makeMap(map = {}) {
    const mapCopy = JSON.parse(JSON.stringify(map));
    function transformMap(mapSubtree, customSubtree) {
      // replace the subtree
      if (mapSubtree === undefined || typeof mapSubtree === 'string') {
        return customSubtree;
      }
      const result = mapSubtree;
      for (const [char, subtree] of Object.entries(customSubtree)) {
        result[char] = transformMap(mapSubtree[char], subtree);
      }
      return result;
    }
    return transformMap(mapCopy, customTree);
  };
}

const methods = Object.freeze({
  HEPBURN: 'hepburn',
});

let kanaToHepburnMap = null;

function createKanaToHepburnMap() {
  const romajiTree = transform({
    あ: 'a',
    い: 'i',
    う: 'u',
    え: 'e',
    お: 'o',
    か: 'ka',
    き: 'ki',
    く: 'ku',
    け: 'ke',
    こ: 'ko',
    さ: 'sa',
    し: 'shi',
    す: 'su',
    せ: 'se',
    そ: 'so',
    た: 'ta',
    ち: 'chi',
    つ: 'tsu',
    て: 'te',
    と: 'to',
    な: 'na',
    に: 'ni',
    ぬ: 'nu',
    ね: 'ne',
    の: 'no',
    は: 'ha',
    ひ: 'hi',
    ふ: 'fu',
    へ: 'he',
    ほ: 'ho',
    ま: 'ma',
    み: 'mi',
    む: 'mu',
    め: 'me',
    も: 'mo',
    や: 'ya',
    ゆ: 'yu',
    よ: 'yo',
    ら: 'ra',
    り: 'ri',
    る: 'ru',
    れ: 're',
    ろ: 'ro',
    わ: 'wa',
    ゐ: 'wi',
    ゑ: 'we',
    を: 'wo',
    が: 'ga',
    ぎ: 'gi',
    ぐ: 'gu',
    げ: 'ge',
    ご: 'go',
    ざ: 'za',
    じ: 'ji',
    ず: 'zu',
    ぜ: 'ze',
    ぞ: 'zo',
    だ: 'da',
    ぢ: 'ji',
    づ: 'zu',
    で: 'de',
    ど: 'do',
    ば: 'ba',
    び: 'bi',
    ぶ: 'bu',
    べ: 'be',
    ぼ: 'bo',
    ぱ: 'pa',
    ぴ: 'pi',
    ぷ: 'pu',
    ぺ: 'pe',
    ぽ: 'po',
    ゔぁ: 'va',
    ゔぃ: 'vi',
    ゔ: 'vu',
    ゔぇ: 've',
    ゔぉ: 'vo',
    ん: 'n',
  });

  const subtreeOf = (string) => getSubTreeOf(romajiTree, string);
  const setTrans = (string, transliteration) => {
    subtreeOf(string)[''] = transliteration;
  };

  const specialSymbols = {
    '。': '.',
    '、': ',',
    '：': ':',
    '・': '/',
    '！': '!',
    '？': '?',
    '〜': '~',
    'ー': '-',
    '「': '‘',
    '」': '’',
    '『': '“',
    '』': '”',
    '［': '[',
    '］': ']',
    '（': '(',
    '）': ')',
    '｛': '{',
    '｝': '}',
    '　': ' ',
  };

  for (const [jsymbol, symbol] of Object.entries(specialSymbols)) {
    subtreeOf(jsymbol)[''] = symbol;
  }

  /* eslint-disable object-curly-newline */
  const smallY = { ゃ: 'ya', ゅ: 'yu', ょ: 'yo' };
  const smallYExtra = { ぃ: 'yi', ぇ: 'ye' };
  const smallaiueo = { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o' };

  for (const [rom, kan] of Object.entries(smallY).concat(Object.entries(smallaiueo))) {
    setTrans(rom, kan);
  }

  const yoonKana = ['き', 'に', 'ひ', 'み', 'り', 'ぎ', 'び', 'ぴ', 'ゔ', 'く', 'ふ'];
  // きゃ -> kya
  for (const kana of yoonKana) {
    const fistRomajiLetter = subtreeOf(kana)[''][0];
    for (const [yKan, yRom] of Object.entries(smallY)) {
      setTrans(kana + yKan, fistRomajiLetter + yRom);
    }
    // きぃ -> kyi
    for (const [yKan, yRom] of Object.entries(smallYExtra)) {
      setTrans(kana + yKan, fistRomajiLetter + yRom);
    }
  }
  const yoonExceptions = { し: 'sh', ち: 'ch', じ: 'j', ぢ: 'j' };
  for (const [kana, rom] of Object.entries(yoonExceptions)) {
    // じゃ -> ja
    for (const [yKan, yRom] of Object.entries(smallY)) {
      setTrans(kana + yKan, rom + yRom[1]);
    }
    // じぃ -> jyi, じぇ -> je
    setTrans(`${kana}ぃ`, `${rom}yi`);
    setTrans(`${kana}ぇ`, `${rom}e`);
  }

  // going with the intuitive (yet incorrect) solution where っや -> yya and っぃ -> ii
  // in other words, just assume the sokuon could have been applied to anything

  const sokuonWhitelist = {
    b: 'b',
    c: 't',
    d: 'd',
    f: 'f',
    g: 'g',
    h: 'h',
    j: 'j',
    k: 'k',
    m: 'm',
    p: 'p',
    q: 'q',
    r: 'r',
    s: 's',
    t: 't',
    v: 'v',
    w: 'w',
    x: 'x',
    z: 'z',
  };

  function resolveTsu(tree) {
    const result = {};
    for (const [key, value] of Object.entries(tree)) {
      if (!key) {
        // we have reached the bottom of this branch
        const consonant = value.charAt(0);
        result[key] =
          consonant in sokuonWhitelist ? sokuonWhitelist[consonant] + value : value;
      } else {
        // more subtrees
        result[key] = resolveTsu(value);
      }
    }
    return result;
  }

  romajiTree['っ'] = resolveTsu(romajiTree);

  const smallLetters = {
    っ: '',
    ゃ: 'ya',
    ゅ: 'yu',
    ょ: 'yo',
    ぁ: 'a',
    ぃ: 'i',
    ぅ: 'u',
    ぇ: 'e',
    ぉ: 'o',
  };

  for (const [kan, rom] of Object.entries(smallLetters)) {
    setTrans(kan, rom);
  }

  // んい -> n'i
  const ambig = ['あ', 'い', 'う', 'え', 'お', 'や', 'ゆ', 'よ'];
  for (const kan of ambig) {
    setTrans(`ん${kan}`, `n'${subtreeOf(kan)['']}`);
  }
  // // んば -> mbo
  // const labial = [
  //   'ば', 'び', 'ぶ', 'べ', 'ぼ',
  //   'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',
  //   'ま', 'み', 'む', 'め', 'も',
  // ];
  // for (const kan of labial) {
  //   setTrans(`ん${kan}`, `m${subtreeOf(kan)['']}`);
  // }

  return Object.freeze(JSON.parse(JSON.stringify(romajiTree)));
}

function getKanaToHepburnTree() {
  if (kanaToHepburnMap === null) {
    kanaToHepburnMap = createKanaToHepburnMap();
  }
  return kanaToHepburnMap;
}

function getKanaToRomajiTree(fullOptions) {
  switch (fullOptions.romanization) {
    case methods.HEPBURN:
      return getKanaToHepburnTree(fullOptions);
    default:
      return {};
  }
}

/**
 * @typedef {Object} DefaultOptions
 * @property {Boolean} [useObsoleteKana=false] - Set to true to use obsolete characters, such as ゐ and ゑ.
 * @example
 * toHiragana('we', { useObsoleteKana: true })
 * // => 'ゑ'
 * @property {Boolean} [passRomaji=false] - Set to true to pass romaji when using mixed syllabaries with toKatakana() or toHiragana()
 * @example
 * toHiragana('only convert the katakana: ヒラガナ', { passRomaji: true })
 * // => "only convert the katakana: ひらがな"
 * @property {Boolean} [upcaseKatakana=false] - Set to true to convert katakana to uppercase using toRomaji()
 * @example
 * toRomaji('ひらがな カタカナ', { upcaseKatakana: true })
 * // => "hiragana KATAKANA"
 * @property {Boolean} [IMEMode=false] - Set to true, toHiragana(), or toKatakana() to handle conversion from a text input while it is being typed.
 * @property {String} [romanization='hepburn'] - choose toRomaji() romanization map (currently only hepburn)
 * @property {Function} [customKanaMapping=(defaultMap) => map] - merges custom map with default conversion
 * @example
 * toKana('WanaKana', { customKanaMapping: createCustomMapping({ na: 'に', ka: 'Bana' }) });
 * // => 'ワにBanaに'
 * @property {Function} [customRomajiMapping=(defaultMap) => map] - merges custom map with default conversion
 * @example
 * toRomaji('つじぎり', { customRomajiMapping: createCustomMapping({ じ: 'zi', つ: 'tu', り: 'li' }) });
 * // => 'tuzigili'
 */

/**
 * Default config for WanaKana, user passed options will be merged with this
 * @type {DefaultOptions}
 * @ignore
 */
const DEFAULT_OPTIONS = {
  useObsoleteKana: false,
  passRomaji: false,
  upcaseKatakana: false,
  ignoreCase: false,
  IMEMode: false,
  romanization: methods.HEPBURN,
  customKanaMapping: (map) => map,
  customRomajiMapping: (map) => map,
};

// CharCode References
// http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml
// http://unicode-table.com

const CJK_SYMBOLS_PUNCTUATION = [0x3000, 0x303f];
const KATAKANA_PUNCTUATION = [0x30fb, 0x30fc];
const HIRAGANA_CHARS = [0x3040, 0x309f];
const KATAKANA_CHARS = [0x30a0, 0x30ff];
const ZENKAKU_NUMBERS = [0xff10, 0xff19];
const ZENKAKU_PUNCTUATION_1 = [0xff01, 0xff0f];
const ZENKAKU_PUNCTUATION_2 = [0xff1a, 0xff1f];
const ZENKAKU_PUNCTUATION_3 = [0xff3b, 0xff3f];
const ZENKAKU_PUNCTUATION_4 = [0xff5b, 0xff60];
const ZENKAKU_SYMBOLS_CURRENCY = [0xffe0, 0xffee];
const KANA_PUNCTUATION = [0xff61, 0xff65];
const HANKAKU_KATAKANA = [0xff66, 0xff9f];
const COMMON_CJK = [0x4e00, 0x9fff];
const RARE_CJK = [0x3400, 0x4dbf];
const LATIN_NUMBERS = [0x0030, 0x0039];
const MODERN_ENGLISH = [0x0000, 0x007f];
const HEPBURN_MACRON_RANGES = [
  [0x0100, 0x0101], // Ā ā
  [0x0112, 0x0113], // Ē ē
  [0x012a, 0x012b], // Ī ī
  [0x014c, 0x014d], // Ō ō
  [0x016a, 0x016b], // Ū ū
];
const SMART_QUOTE_RANGES = [
  [0x2018, 0x2019], // ‘ ’
  [0x201c, 0x201d], // “ ”
];

// const FULL_LATIN_RANGES = [
//   [0x0001-0x007F],
//   [0x0080-0x00FF],
//   [0x0100-0x017F],
//   [0x0180-0x024F],
// ];

const JA_PUNCTUATION_RANGES = [
  CJK_SYMBOLS_PUNCTUATION,
  KANA_PUNCTUATION,
  KATAKANA_PUNCTUATION,
  ZENKAKU_PUNCTUATION_1,
  ZENKAKU_PUNCTUATION_2,
  ZENKAKU_PUNCTUATION_3,
  ZENKAKU_PUNCTUATION_4,
  ZENKAKU_SYMBOLS_CURRENCY,
];

const KANA_RANGES = [HIRAGANA_CHARS, KATAKANA_CHARS, KANA_PUNCTUATION, HANKAKU_KATAKANA];

/**
 * All Japanese unicode start and end ranges
 * Includes full-width punctuation and number ranges.
 * Incudes latin numbers since they are used in Japanese text as well.
 * @type {Array}
 * @ignore
 */
const JAPANESE_RANGES = [
  ...KANA_RANGES,
  ...JA_PUNCTUATION_RANGES,
  LATIN_NUMBERS,
  ZENKAKU_NUMBERS,
  COMMON_CJK,
  RARE_CJK,
];

/**
 * Basic Latin unicode regex, for determining Romaji + Hepburn romanisation
 * Includes upper/lowercase long vowels like "ā, ī, ū, ē, ō"
 * Includes smart quotes ‘’ “”
 * @type {Array}
 * @ignore
 */
const ROMAJI_RANGES = [
  MODERN_ENGLISH,
  ...HEPBURN_MACRON_RANGES,
  ...SMART_QUOTE_RANGES,
];

const EN_PUNCTUATION_RANGES = [
  [0x21, 0x2f],
  [0x3a, 0x3f],
  [0x5b, 0x60],
  [0x7b, 0x7e],
  ...SMART_QUOTE_RANGES,
];

const LOWERCASE_START = 0x61;

const UPPERCASE_START = 0x41;
const UPPERCASE_END = 0x5a;
const LOWERCASE_FULLWIDTH_START = 0xff41;
const LOWERCASE_FULLWIDTH_END = 0xff5a;
const UPPERCASE_FULLWIDTH_START = 0xff21;
const UPPERCASE_FULLWIDTH_END = 0xff3a;
const HIRAGANA_START = 0x3041;
const HIRAGANA_END = 0x3096;
const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30fc;
const KANJI_START = 0x4e00;
const KANJI_END = 0x9faf;
const PROLONGED_SOUND_MARK = 0x30fc;
const KANA_SLASH_DOT = 0x30fb;

const LONG_VOWELS = {
  a: 'あ',
  i: 'い',
  u: 'う',
  e: 'え',
  o: 'う',
};

const TO_ROMAJI = {
  '　': ' ',
  '！': '!',
  '？': '?',
  '。': '.',
  '：': ':',
  '・': '/',
  '、': ',',
  '〜': '~',
  'ー': '-',
  '「': '‘',
  '」': '’',
  '『': '“',
  '』': '”',
  '［': '[',
  '］': ']',
  '（': '(',
  '）': ')',
  '｛': '{',
  '｝': '}',

  'あ': 'a',
  'い': 'i',
  'う': 'u',
  'え': 'e',
  'お': 'o',
  'ゔぁ': 'va',
  'ゔぃ': 'vi',
  'ゔ': 'vu',
  'ゔぇ': 've',
  'ゔぉ': 'vo',
  'か': 'ka',
  'き': 'ki',
  'きゃ': 'kya',
  'きぃ': 'kyi',
  'きゅ': 'kyu',
  'く': 'ku',
  'け': 'ke',
  'こ': 'ko',
  'が': 'ga',
  'ぎ': 'gi',
  'ぐ': 'gu',
  'げ': 'ge',
  'ご': 'go',
  'ぎゃ': 'gya',
  'ぎぃ': 'gyi',
  'ぎゅ': 'gyu',
  'ぎぇ': 'gye',
  'ぎょ': 'gyo',
  'さ': 'sa',
  'す': 'su',
  'せ': 'se',
  'そ': 'so',
  'ざ': 'za',
  'ず': 'zu',
  'ぜ': 'ze',
  'ぞ': 'zo',
  'し': 'shi',
  'しゃ': 'sha',
  'しゅ': 'shu',
  'しょ': 'sho',
  'じ': 'ji',
  'じゃ': 'ja',
  'じゅ': 'ju',
  'じょ': 'jo',
  'た': 'ta',
  'ち': 'chi',
  'ちゃ': 'cha',
  'ちゅ': 'chu',
  'ちょ': 'cho',
  'つ': 'tsu',
  'て': 'te',
  'と': 'to',
  'だ': 'da',
  'ぢ': 'di',
  'づ': 'du',
  'で': 'de',
  'ど': 'do',
  'な': 'na',
  'に': 'ni',
  'にゃ': 'nya',
  'にゅ': 'nyu',
  'にょ': 'nyo',
  'ぬ': 'nu',
  'ね': 'ne',
  'の': 'no',
  'は': 'ha',
  'ひ': 'hi',
  'ふ': 'fu',
  'へ': 'he',
  'ほ': 'ho',
  'ひゃ': 'hya',
  'ひゅ': 'hyu',
  'ひょ': 'hyo',
  'ふぁ': 'fa',
  'ふぃ': 'fi',
  'ふぇ': 'fe',
  'ふぉ': 'fo',
  'ば': 'ba',
  'び': 'bi',
  'ぶ': 'bu',
  'べ': 'be',
  'ぼ': 'bo',
  'びゃ': 'bya',
  'びゅ': 'byu',
  'びょ': 'byo',
  'ぱ': 'pa',
  'ぴ': 'pi',
  'ぷ': 'pu',
  'ぺ': 'pe',
  'ぽ': 'po',
  'ぴゃ': 'pya',
  'ぴゅ': 'pyu',
  'ぴょ': 'pyo',
  'ま': 'ma',
  'み': 'mi',
  'む': 'mu',
  'め': 'me',
  'も': 'mo',
  'みゃ': 'mya',
  'みゅ': 'myu',
  'みょ': 'myo',
  'や': 'ya',
  'ゆ': 'yu',
  'よ': 'yo',
  'ら': 'ra',
  'り': 'ri',
  'る': 'ru',
  'れ': 're',
  'ろ': 'ro',
  'りゃ': 'rya',
  'りゅ': 'ryu',
  'りょ': 'ryo',
  'わ': 'wa',
  'を': 'wo',
  'ん': 'n',

  // Archaic characters
  'ゐ': 'wi',
  'ゑ': 'we',

  // Uncommon character combos
  'きぇ': 'kye',
  'きょ': 'kyo',
  'じぃ': 'jyi',
  'じぇ': 'jye',
  'ちぃ': 'cyi',
  'ちぇ': 'che',
  'ひぃ': 'hyi',
  'ひぇ': 'hye',
  'びぃ': 'byi',
  'びぇ': 'bye',
  'ぴぃ': 'pyi',
  'ぴぇ': 'pye',
  'みぇ': 'mye',
  'みぃ': 'myi',
  'りぃ': 'ryi',
  'りぇ': 'rye',
  'にぃ': 'nyi',
  'にぇ': 'nye',
  'しぃ': 'syi',
  'しぇ': 'she',
  'いぇ': 'ye',
  'うぁ': 'wha',
  'うぉ': 'who',
  'うぃ': 'wi',
  'うぇ': 'we',
  'ゔゃ': 'vya',
  'ゔゅ': 'vyu',
  'ゔょ': 'vyo',
  'すぁ': 'swa',
  'すぃ': 'swi',
  'すぅ': 'swu',
  'すぇ': 'swe',
  'すぉ': 'swo',
  'くゃ': 'qya',
  'くゅ': 'qyu',
  'くょ': 'qyo',
  'くぁ': 'qwa',
  'くぃ': 'qwi',
  'くぅ': 'qwu',
  'くぇ': 'qwe',
  'くぉ': 'qwo',
  'ぐぁ': 'gwa',
  'ぐぃ': 'gwi',
  'ぐぅ': 'gwu',
  'ぐぇ': 'gwe',
  'ぐぉ': 'gwo',
  'つぁ': 'tsa',
  'つぃ': 'tsi',
  'つぇ': 'tse',
  'つぉ': 'tso',
  'てゃ': 'tha',
  'てぃ': 'thi',
  'てゅ': 'thu',
  'てぇ': 'the',
  'てょ': 'tho',
  'とぁ': 'twa',
  'とぃ': 'twi',
  'とぅ': 'twu',
  'とぇ': 'twe',
  'とぉ': 'two',
  'ぢゃ': 'dya',
  'ぢぃ': 'dyi',
  'ぢゅ': 'dyu',
  'ぢぇ': 'dye',
  'ぢょ': 'dyo',
  'でゃ': 'dha',
  'でぃ': 'dhi',
  'でゅ': 'dhu',
  'でぇ': 'dhe',
  'でょ': 'dho',
  'どぁ': 'dwa',
  'どぃ': 'dwi',
  'どぅ': 'dwu',
  'どぇ': 'dwe',
  'どぉ': 'dwo',
  'ふぅ': 'fwu',
  'ふゃ': 'fya',
  'ふゅ': 'fyu',
  'ふょ': 'fyo',

  //  Small Characters (normally not transliterated alone)
  'ぁ': 'a',
  'ぃ': 'i',
  'ぇ': 'e',
  'ぅ': 'u',
  'ぉ': 'o',
  'ゃ': 'ya',
  'ゅ': 'yu',
  'ょ': 'yo',
  'っ': '',
  'ゕ': 'ka',
  'ゖ': 'ka',
  'ゎ': 'wa',

  // Ambiguous consonant vowel pairs
  'んあ': "n'a",
  'んい': "n'i",
  'んう': "n'u",
  'んえ': "n'e",
  'んお': "n'o",
  'んや': "n'ya",
  'んゆ': "n'yu",
  'んよ': "n'yo",
};

/**
 * Checks if input string is empty
 * @param  {String} input text input
 * @return {Boolean} true if no input
 */
function isEmpty(input) {
  if (typeof input !== 'string') {
    return true;
  }
  return !input.length;
}

/**
 * Takes a character and a unicode range. Returns true if the char is in the range.
 * @param  {String}  char  unicode character
 * @param  {Number}  start unicode start range
 * @param  {Number}  end   unicode end range
 * @return {Boolean}
 */
function isCharInRange(char = '', start, end) {
  if (isEmpty(char)) return false;
  const code = char.charCodeAt(0);
  return start <= code && code <= end;
}

/**
 * Converts all fullwidth roman letters in string to proper ASCII
 * @param  {String} text Full Width roman letters
 * @return {String} ASCII
 */
function convertFullwidthCharsToASCII(text = '') {
  const asciiChars = [...text].map((char, index) => {
    const code = char.charCodeAt(0);
    const lower = isCharInRange(char, LOWERCASE_FULLWIDTH_START, LOWERCASE_FULLWIDTH_END);
    const upper = isCharInRange(char, UPPERCASE_FULLWIDTH_START, UPPERCASE_FULLWIDTH_END);
    if (lower) {
      return String.fromCharCode((code - LOWERCASE_FULLWIDTH_START) + LOWERCASE_START);
    } else if (upper) {
      return String.fromCharCode((code - UPPERCASE_FULLWIDTH_START) + UPPERCASE_START);
    }
    return char;
  });
  return asciiChars.join('');
}

/**
 * Tests a character and an english consonant. Returns true if the char is a consonant.
 * @param  {String} char
 * @param  {Boolean} [includeY=true] Optional parameter to include y as a consonant in test
 * @return {Boolean}
 */
function isCharConsonant(char = '', includeY = true) {
  if (isEmpty(char)) return false;
  const regexp = includeY ? /[bcdfghjklmnpqrstvwxyz]/ : /[bcdfghjklmnpqrstvwxz]/;
  return char.toLowerCase().charAt(0).search(regexp) !== -1;
}

let romajiToKanaMap = null;

function createRomajiToKanaMap() {
  // not exactly kunrei shiki, for example ぢゃ -> dya instead of zya, to avoid name clashing
  const kunreiTree = {
    a: 'あ',
    i: 'い',
    u: 'う',
    e: 'え',
    o: 'お',
    k: { a: 'か', i: 'き', u: 'く', e: 'け', o: 'こ' },
    s: { a: 'さ', i: 'し', u: 'す', e: 'せ', o: 'そ' },
    t: { a: 'た', i: 'ち', u: 'つ', e: 'て', o: 'と' },
    n: { a: 'な', i: 'に', u: 'ぬ', e: 'ね', o: 'の' },
    h: { a: 'は', i: 'ひ', u: 'ふ', e: 'へ', o: 'ほ' },
    m: { a: 'ま', i: 'み', u: 'む', e: 'め', o: 'も' },
    y: { a: 'や', u: 'ゆ', o: 'よ' },
    r: { a: 'ら', i: 'り', u: 'る', e: 'れ', o: 'ろ' },
    w: { a: 'わ', i: 'ゐ', e: 'ゑ', o: 'を' },
    g: { a: 'が', i: 'ぎ', u: 'ぐ', e: 'げ', o: 'ご' },
    z: { a: 'ざ', i: 'じ', u: 'ず', e: 'ぜ', o: 'ぞ' },
    d: { a: 'だ', i: 'ぢ', u: 'づ', e: 'で', o: 'ど' },
    b: { a: 'ば', i: 'び', u: 'ぶ', e: 'べ', o: 'ぼ' },
    p: { a: 'ぱ', i: 'ぴ', u: 'ぷ', e: 'ぺ', o: 'ぽ' },

    v: { a: 'ゔぁ', i: 'ゔぃ', u: 'ゔ', e: 'ゔぇ', o: 'ゔぉ' },
  };

  const kanaTree = transform(kunreiTree);
  // pseudo partial application
  const subtreeOf = (string) => getSubTreeOf(kanaTree, string);

  const consonants = {
    k: 'き',
    s: 'し',
    t: 'ち',
    n: 'に',
    h: 'ひ',
    m: 'み',
    r: 'り',
    g: 'ぎ',
    z: 'じ',
    d: 'ぢ',
    b: 'び',
    p: 'ぴ',

    v: 'ゔ',
    q: 'く',
    f: 'ふ',
  };

  const smallY = { ya: 'ゃ', yi: 'ぃ', yu: 'ゅ', ye: 'ぇ', yo: 'ょ' };
  const smallaiueo = { a: 'ぁ', i: 'ぃ', u: 'ぅ', e: 'ぇ', o: 'ぉ' };

  // add tya, sya, etc.
  for (const [consonant, yKana] of Object.entries(consonants)) {
    for (const [rom, kan] of Object.entries(smallY)) {
      // for example kyo -> き + ょ
      subtreeOf(consonant + rom)[''] = yKana + kan;
    }
  }

  const specialSymbols = {
    '.': '。',
    ',': '、',
    ':': '：',
    '/': '・',
    '!': '！',
    '?': '？',
    '~': '〜',
    '-': 'ー',
    '‘': '「',
    '’': '」',
    '“': '『',
    '”': '』',
    '[': '［',
    ']': '］',
    '(': '（',
    ')': '）',
    '{': '｛',
    '}': '｝',
  };

  for (const [symbol, jsymbol] of Object.entries(specialSymbols)) {
    subtreeOf(symbol)[''] = jsymbol;
  }

  const aiueoConstructions = {
    wh: 'う',
    qw: 'く',
    q: 'く',
    gw: 'ぐ',
    sw: 'す',
    ts: 'つ',
    th: 'て',
    tw: 'と',
    dh: 'で',
    dw: 'ど',
    fw: 'ふ',
    f: 'ふ',
  };

  // things like うぃ, くぃ, etc.
  for (const [consonant, aiueoKan] of Object.entries(aiueoConstructions)) {
    for (const [vow, kan] of Object.entries(smallaiueo)) {
      const subtree = subtreeOf(consonant + vow);
      subtree[''] = aiueoKan + kan;
    }
  }

  // different ways to write ん
  for (const nvar of ['n', 'n\'', 'xn']) {
    subtreeOf(nvar)[''] = 'ん';
  }

  // typing one should be the same as having typed the other instead
  const alternativeMappings = {
    sh: 'sy',  // sha -> sya
    ch: 'ty',  // cho -> tyo
    cy: 'ty',  // cyo -> tyo
    chy: 'ty',  // chyu -> tyu
    shy: 'sy',  // shya -> sya
    j: 'zy',  // ja -> zya
    jy: 'zy',  // jye -> zye

    // exceptions to above rules
    shi: 'si',
    chi: 'ti',
    tsu: 'tu',
    ji: 'zi',
    fu: 'hu',
  };

  // c is equivalent to k, but not for chi, cha, etc. that's why we have to make a copy of k
  kanaTree.c = JSON.parse(JSON.stringify(kanaTree.k));

  for (const [string, alternative] of Object.entries(alternativeMappings)) {
    const allExceptLast = string.slice(0, string.length - 1);
    const last = string.charAt(string.length - 1);
    const parentTree = subtreeOf(allExceptLast);
    // copy to avoid recursive containment
    parentTree[last] = JSON.parse(JSON.stringify(subtreeOf(alternative)));
  }


  // xtu -> っ
  const smallLetters = Object.assign({ tu: 'っ', wa: 'ゎ', ka: 'ヵ', ke: 'ヶ' }, smallaiueo, smallY);

  function getAlternatives(string) {
    const result = [];
    for (const [alt, rom] of Object.entries(alternativeMappings).concat([['c', 'k']])) {
      if (string.startsWith(rom)) {
        result.push(string.replace(rom, alt));
      }
    }
    return result;
  }

  for (const [kunreiRom, kan] of Object.entries(smallLetters)) {
    {
      const xRom = `x${kunreiRom}`;
      const xSubtree = subtreeOf(xRom);
      xSubtree[''] = kan;

      // ltu -> xtu -> っ
      const allExceptLast = kunreiRom.slice(0, kunreiRom.length - 1);
      const last = kunreiRom.charAt(kunreiRom.length - 1);
      const parentTree = subtreeOf(`l${allExceptLast}`);
      parentTree[last] = xSubtree;
    }

    // ltsu -> ltu -> っ
    for (const altRom of getAlternatives(kunreiRom)) {
      const allExceptLast = altRom.slice(0, altRom.length - 1);
      const last = altRom.charAt(altRom.length - 1);
      for (const prefix of ['l', 'x']) {
        const parentTree = subtreeOf(prefix + allExceptLast);
        parentTree[last] = subtreeOf(prefix + kunreiRom);
      }
    }
  }

  // don't follow any notable patterns
  const individualCases = {
    yi: 'い',
    wu: 'う',
    ye: 'いぇ',
    wi: 'うぃ',
    we: 'うぇ',
    kwa: 'くぁ',
    whu: 'う',
    // because it's not thya for てゃ but tha
    // and tha is not てぁ, but てゃ
    tha: 'てゃ',
    thu: 'てゅ',
    tho: 'てょ',
    dha: 'でゃ',
    dhu: 'でゅ',
    dho: 'でょ',
  };

  for (const [string, kana] of Object.entries(individualCases)) {
    subtreeOf(string)[''] = kana;
  }

  // add kka, tta, etc.
  function addTsu(tree) {
    const result = {};
    for (const [key, value] of Object.entries(tree)) {
      if (!key) {  // we have reached the bottom of this branch
        result[key] = `っ${value}`;
      } else {  // more subtrees
        result[key] = addTsu(value);
      }
    }
    return result;
  }
  // have to explicitly name c here, because we made it a copy of k, not a reference
  for (const consonant of Object.keys(consonants).concat('c', 'y', 'w', 'j')) {
    const subtree = kanaTree[consonant];
    subtree[consonant] = addTsu(subtree);
  }
  // nn should not be っん
  delete kanaTree.n.n;
  // solidify the results, so that there there is referential transparency within the tree
  return Object.freeze(JSON.parse(JSON.stringify(kanaTree)));
}

function getRomajiToKanaTree(config) {
  if (romajiToKanaMap === null) {
    romajiToKanaMap = createRomajiToKanaMap();
  }
  return romajiToKanaMap;
}

const USE_OBSOLETE_KANA_MAP = createCustomMapping({ wi: 'ゐ', we: 'ゑ' });

function IME_MODE_MAP(map) {
  // in IME mode, we do not want to convert single ns
  const mapCopy = JSON.parse(JSON.stringify(map));
  mapCopy.n.n = { '': 'ん' };
  mapCopy.n[' '] = { '': 'ん' };
  return mapCopy;
}

/**
 * Tests if char is in English unicode uppercase range
 * @param  {String} char
 * @return {Boolean}
 */
function isCharUpperCase(char = '') {
  if (isEmpty(char)) return false;
  return isCharInRange(char, UPPERCASE_START, UPPERCASE_END);
}

/**
 * Returns true if char is 'ー'
 * @param  {String} char to test
 * @return {Boolean}
 */
function isCharLongDash(char = '') {
  if (isEmpty(char)) return false;
  return char.charCodeAt(0) === PROLONGED_SOUND_MARK;
}

/**
 * Tests if char is '・'
 * @param  {String} char
 * @return {Boolean} true if '・'
 */
function isCharSlashDot(char = '') {
  if (isEmpty(char)) return false;
  return char.charCodeAt(0) === KANA_SLASH_DOT;
}

/**
 * Tests a character. Returns true if the character is [Hiragana](https://en.wikipedia.org/wiki/Hiragana).
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharHiragana(char = '') {
  if (isEmpty(char)) return false;
  if (isCharLongDash(char)) return true;
  return isCharInRange(char, HIRAGANA_START, HIRAGANA_END);
}

/**
 * Convert [Hiragana](https://en.wikipedia.org/wiki/Hiragana) to [Katakana](https://en.wikipedia.org/wiki/Katakana)
 * Passes through any non-hiragana chars
 * @param  {String} [input=''] text input
 * @return {String} converted text
 * @example
 * hiraganaToKatakana('ひらがな')
 * // => "ヒラガナ"
 * hiraganaToKatakana('ひらがな is a type of kana')
 * // => "ヒラガナ is a type of kana"
 * @ignore
 */
function hiraganaToKatakana(input = '') {
  const kata = [];
  input.split('').forEach((char) => {
    // Short circuit to avoid incorrect codeshift for 'ー' and '・'
    if (isCharLongDash(char) || isCharSlashDot(char)) {
      kata.push(char);
    } else if (isCharHiragana(char)) {
      // Shift charcode.
      const code = char.charCodeAt(0) + (KATAKANA_START - HIRAGANA_START);
      const kataChar = String.fromCharCode(code);
      kata.push(kataChar);
    } else {
      // Pass non-hiragana chars through
      kata.push(char);
    }
  });
  return kata.join('');
}

/**
 * Convert [Romaji](https://en.wikipedia.org/wiki/Romaji) to [Kana](https://en.wikipedia.org/wiki/Kana), lowercase text will result in [Hiragana](https://en.wikipedia.org/wiki/Hiragana) and uppercase text will result in [Katakana](https://en.wikipedia.org/wiki/Katakana).
 * @param  {String} [input=''] text
 * @param  {DefaultOptions} [options=defaultOptions]
 * @return {String} converted text
 * @example
 * toKana('onaji BUTTSUUJI')
 * // => 'おなじ ブッツウジ'
 * toKana('ONAJI buttsuuji')
 * // => 'オナジ ぶっつうじ'
 * toKana('座禅‘zazen’スタイル')
 * // => '座禅「ざぜん」スタイル'
 * toKana('batsuge-mu')
 * // => 'ばつげーむ'
 * toKana('!?.:/,~-‘’“”[](){}') // Punctuation conversion
 * // => '！？。：・、〜ー「」『』［］（）｛｝'
 * toKana('we', { useObsoleteKana: true })
 * // => 'ゑ'
 * toKana('WanaKana', { customKanaMapping: createCustomMapping({ na: 'に', ka: 'Bana' }) });
 * // => 'ワにBanaに'
 */
function toKana(input = '', options = {}) {
  // just throw away the substring index information and just concatenate all the kana
  return splitIntoKana(input, options)
    .map((kanaToken) => {
      const [start, , kana] = kanaToken;
      if (kana === null) {
        // haven't converted the end of the string, since we are in IME mode
        return input.slice(start);
      }
      // make katakana, if the first letter of the syllable is upper case
      return isCharUpperCase(input.charAt(start)) ? hiraganaToKatakana(kana) : kana;
    })
    .join('');
}

function splitIntoKana(input = '', options = {}) {
  const config = Object.assign({}, DEFAULT_OPTIONS, options);

  let map = getRomajiToKanaTree(config);
  map = config.IMEMode ? IME_MODE_MAP(map) : map;
  map = config.useObsoleteKana ? USE_OBSOLETE_KANA_MAP(map) : map;
  // TODO: accept object or function, if object, use createCustomMapping automatically?
  map = config.customKanaMapping(map);
  return applyMapping(input.toLowerCase(), map, !config.IMEMode);
}

/* import { addDebugListeners, removeDebugListeners } from './utils/logInputEvents';*/

const ELEMENTS = ['TEXTAREA', 'INPUT'];
let LISTENERS = [];
let idCounter = 0;
let ignoreMicrosoftIMEDoubleConsonant = false;

const newId = () => {
  idCounter += 1;
  return `${Date.now()}${idCounter}`;
};

/**
 * Binds eventListener for 'input' events to an input field to automagically replace values with kana
 * Can pass { IMEMode: 'toHiragana' } or `'toKatakana'` as second param to enforce kana conversion type
 * @param  {HTMLElement} input textarea, input[type="text"] etc
 * @param  {DefaultOptions} [options=defaultOptions] defaults to { IMEMode: true } using `toKana`
 */
function bind(input, options = {}) {
  const listener = onInput(options);
  if (input instanceof Element && ELEMENTS.includes(input.nodeName)) {
    const id = newId();
    /* addDebugListeners(input);*/
    input.setAttribute('data-wanakana-id', id);
    input.autocapitalize = 'none'; // eslint-disable-line no-param-reassign
    input.addEventListener('compositionupdate', onCompositionUpdate);
    input.addEventListener('input', listener);
    LISTENERS = trackListener(listener, id);
  } else {
    console.warn('Element provided to Wanakana bind() was not a valid input field.'); // eslint-disable-line no-console
  }
}

/**
 * Unbinds eventListener from input field
 * @param  {HTMLElement} input textarea, input[type="text"] etc
 */
function unbind(input) {
  const trackedListener = findListener(input);
  if (trackedListener != null) {
    /* removeDebugListeners(input); */
    input.removeAttribute('data-wanakana-id');
    input.removeEventListener('compositionupdate', onCompositionUpdate);
    input.removeEventListener('input', trackedListener.handler);
    LISTENERS = untrackListener(trackedListener);
  } else {
    console.warn('Element provided to Wanakana unbind() had no listener registered.'); // eslint-disable-line no-console
  }
}

/**
 * Automagically replaces input values with converted text to kana
 * @param  {Object} event DOM event to listen to
 * @param  {defaultOptions} [options] user config overrides, default conversion is toKana()
 * @return {Function} event handler with bound options
 * @ignore
 */
function onInput(options) {
  const config = Object.assign({}, DEFAULT_OPTIONS, options);
  return function listener(event) {
    const input = event.target;

    if (ignoreMicrosoftIMEDoubleConsonant) {
      ignoreMicrosoftIMEDoubleConsonant = false;
      return;
    }

    const normalizedInputString = convertFullwidthCharsToASCII(input.value);
    const hiraOrKataString = setKanaType(normalizedInputString, config.IMEMode);
    const ensureIMEModeConfig = Object.assign({}, config, { IMEMode: true });
    const kanaTokens = splitIntoKana(hiraOrKataString, ensureIMEModeConfig);
    const newText = toKana(hiraOrKataString, ensureIMEModeConfig);

    if (normalizedInputString !== newText) {
      const { selectionEnd } = input;
      input.value = newText;

      if (selectionEnd === 0) {
        input.setSelectionRange(0, 0);
      } else {
        input.setSelectionRange(input.value.length, input.value.length);
        let kanaLength = 0;
        for (let index = 0; index < kanaTokens.length; index += 1) {
          const [tokenStart, tokenEnd, maybeTokenKana] = kanaTokens[index];
          const tokenKana = maybeTokenKana !== null? maybeTokenKana: hiraOrKataString.slice(tokenStart);
          kanaLength += tokenKana.length;
          if (tokenEnd >= selectionEnd) {
            input.setSelectionRange(kanaLength, kanaLength);
            break;
          }
        }
      }
    }
  };
}

/**
 * Sets a flag on compositionupdate for a once-off ignore in onInput
 * see https://github.com/WaniKani/WanaKana/issues/48
 * @param  {object} event compositionupdate event
 * @ignore
 */
function onCompositionUpdate(event) {
  const data = event.data || (event.detail && event.detail.data); // have to use custom event with detail in tests
  const finalTwoChars = (data && data.slice(-2)) || '';
  const isFirstLetterN = finalTwoChars[0] === 'n';
  const isDoubleConsonant = convertFullwidthCharsToASCII(finalTwoChars)
    .split('')
    .every(isCharConsonant);

  ignoreMicrosoftIMEDoubleConsonant = !isFirstLetterN && isDoubleConsonant;
}

function trackListener(listener, id) {
  return LISTENERS.concat({
    id,
    handler: listener,
  });
}

function findListener(input) {
  return (
    input && LISTENERS.find(({ id }) => id === input.getAttribute('data-wanakana-id'))
  );
}

function untrackListener({ id: targetId }) {
  return LISTENERS.filter(({ id }) => id !== targetId);
}

// easy way to still use `toKana` to handle IME input - but with forced conversion type
function setKanaType(input, flag) {
  switch (true) {
    case flag === 'toHiragana':
      return input.toLowerCase();
    case flag === 'toKatakana':
      return input.toUpperCase();
    default:
      return input;
  }
}

/**
 * Tests a character. Returns true if the character is [Romaji](https://en.wikipedia.org/wiki/Romaji) (allowing [Hepburn romanisation](https://en.wikipedia.org/wiki/Hepburn_romanization))
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharRomaji(char = '') {
  if (isEmpty(char)) return false;
  return ROMAJI_RANGES.some(([start, end]) => isCharInRange(char, start, end));
}

/**
 * Test if `input` is [Romaji](https://en.wikipedia.org/wiki/Romaji) (allowing [Hepburn romanisation](https://en.wikipedia.org/wiki/Hepburn_romanization))
 * @param  {String} [input=''] text
 * @return {Boolean} true if [Romaji](https://en.wikipedia.org/wiki/Romaji)
 * @example
 * isRomaji('Tōkyō and Ōsaka')
 * // => true
 * isRomaji('12a*b&c-d')
 * // => true
 * isRomaji('あアA')
 * // => false
 * isRomaji('お願い')
 * // => false
 * isRomaji('a！b&cーd') // Full-width punctuation fails
 * // => false
 */
function isRomaji(input = '') {
  if (isEmpty(input)) return false;
  return [...input].every(isCharRomaji);
}

/**
 * Tests a character. Returns true if the character is [Katakana](https://en.wikipedia.org/wiki/Katakana).
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharJapanese(char = '') {
  return JAPANESE_RANGES.some(([start, end]) => isCharInRange(char, start, end));
}

/**
 * Test if `input` only includes [Kanji](https://en.wikipedia.org/wiki/Kanji), [Kana](https://en.wikipedia.org/wiki/Kana), zenkaku punctuation, japanese symbols and numbers.”
 * @param  {String} [input=''] text
 * @return {Boolean} true if passes checks
 * @example
 * isJapanese('泣き虫')
 * // => true
 * isJapanese('あア')
 * // => true
 * isJapanese('２月1日') // Full and half-width numbers allowed
 * // => true
 * isJapanese('泣き虫。！〜＄')
 * // => true
 * isJapanese('泣き虫.!~$') // Half-width / Latin punctuation fails
 * // => false
 * isJapanese('A泣き虫')
 * // => false
 * isJapanese('A')
 * // => false
 */
function isJapanese(input = '') {
  if (isEmpty(input)) return false;
  return [...input].every(isCharJapanese);
}

/**
 * Tests a character. Returns true if the character is [Katakana](https://en.wikipedia.org/wiki/Katakana).
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharKatakana(char = '') {
  return isCharInRange(char, KATAKANA_START, KATAKANA_END);
}

/**
 * Tests a character. Returns true if the character is [Hiragana](https://en.wikipedia.org/wiki/Hiragana) or [Katakana](https://en.wikipedia.org/wiki/Katakana).
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharKana(char = '') {
  if (isEmpty(char)) return false;
  return isCharHiragana(char) || isCharKatakana(char);
}

/**
 * Test if `input` is [Kana](https://en.wikipedia.org/wiki/Kana) ([Katakana](https://en.wikipedia.org/wiki/Katakana) and/or [Hiragana](https://en.wikipedia.org/wiki/Hiragana))
 * @param  {String} [input=''] text
 * @return {Boolean} true if all [Kana](https://en.wikipedia.org/wiki/Kana)
 * @example
 * isKana('あ')
 * // => true
 * isKana('ア')
 * // => true
 * isKana('あーア')
 * // => true
 * isKana('A')
 * // => false
 * isKana('あAア')
 * // => false
 */
function isKana(input = '') {
  if (isEmpty(input)) return false;
  return [...input].every(isCharKana);
}

/**
 * Test if `input` is [Hiragana](https://en.wikipedia.org/wiki/Hiragana)
 * @param  {String} [input=''] text
 * @return {Boolean} true if all [Hiragana](https://en.wikipedia.org/wiki/Hiragana)
 * @example
 * isHiragana('げーむ')
 * // => true
 * isHiragana('A')
 * // => false
 * isHiragana('あア')
 * // => false
 */
function isHiragana(input = '') {
  if (isEmpty(input)) return false;
  return [...input].every(isCharHiragana);
}

/**
 * Test if `input` is [Katakana](https://en.wikipedia.org/wiki/Katakana)
 * @param  {String} [input=''] text
 * @return {Boolean} true if all [Katakana](https://en.wikipedia.org/wiki/Katakana)
 * @example
 * isKatakana('ゲーム')
 * // => true
 * isKatakana('あ')
 * // => false
 * isKatakana('A')
 * // => false
 * isKatakana('あア')
 * // => false
 */
function isKatakana(input = '') {
  if (isEmpty(input)) return false;
  return [...input].every(isCharKatakana);
}

/**
 * Tests a character. Returns true if the character is a CJK ideograph (kanji).
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharKanji(char = '') {
  return isCharInRange(char, KANJI_START, KANJI_END);
}

/**
 * Tests if `input` is [Kanji](https://en.wikipedia.org/wiki/Kanji) ([Japanese CJK ideographs](https://en.wikipedia.org/wiki/CJK_Unified_Ideographs))
 * @param  {String} [input=''] text
 * @return {Boolean} true if all [Kanji](https://en.wikipedia.org/wiki/Kanji)
 * @example
 * isKanji('刀')
 * // => true
 * isKanji('切腹')
 * // => true
 * isKanji('勢い')
 * // => false
 * isKanji('あAア')
 * // => false
 * isKanji('🐸')
 * // => false
 */
function isKanji(input = '') {
  if (isEmpty(input)) return false;
  return [...input].every(isCharKanji);
}

/**
 * Test if `input` contains a mix of [Romaji](https://en.wikipedia.org/wiki/Romaji) *and* [Kana](https://en.wikipedia.org/wiki/Kana), defaults to pass through [Kanji](https://en.wikipedia.org/wiki/Kanji)
 * @param  {String} input text
 * @param  {Object} [options={ passKanji: true }] optional config to pass through kanji
 * @return {Boolean} true if mixed
 * @example
 * isMixed('Abあア'))
 * // => true
 * isMixed('お腹A'))
 * // => true
 * isMixed('お腹A', { passKanji: false }))
 * // => false
 * isMixed('ab'))
 * // => false
 * isMixed('あア'))
 * // => false
 */
function isMixed(input = '', options = { passKanji: true }) {
  const chars = [...input];
  let hasKanji = false;
  if (!options.passKanji) {
    hasKanji = chars.some(isKanji);
  }
  return (chars.some(isHiragana) || chars.some(isKatakana)) && chars.some(isRomaji) && !hasKanji;
}

const isCharInitialLongDash = (char, index) => isCharLongDash(char) && index < 1;
const isCharInnerLongDash = (char, index) => isCharLongDash(char) && index > 0;
const isKanaAsSymbol = (char) => ['ヶ', 'ヵ'].includes(char);

/**
 * Convert [Katakana](https://en.wikipedia.org/wiki/Katakana) to [Hiragana](https://en.wikipedia.org/wiki/Hiragana)
 * Passes through any non-katakana chars
 * @param  {String} [input=''] text input
 * @return {String} converted text
 * @example
 * katakanaToHiragana('カタカナ')
 * // => "かたかな"
 * katakanaToHiragana('カタカナ is a type of kana')
 * // => "かたかな is a type of kana"
 * @ignore
 */
function katakanaToHiragana(input = '') {
  const hira = [];
  let previousKana = '';
  const iterable = input.split('');
  for (let index = 0; index < iterable.length; index += 1) {
    const char = iterable[index];
    // Short circuit to avoid incorrect codeshift for 'ー' and '・'
    if (
      isCharSlashDot(char) ||
      isCharInitialLongDash(char, index) ||
      isKanaAsSymbol(char)
    ) {
      hira.push(char);
      // Transform long vowels: 'オー' to 'おう'
    } else if (previousKana && isCharInnerLongDash(char, index)) {
      // Transform previousKana back to romaji, and slice off the vowel
      const romaji = TO_ROMAJI[previousKana].slice(-1);
      hira.push(LONG_VOWELS[romaji]);
    } else if (!isCharLongDash(char) && isCharKatakana(char)) {
      // Shift charcode.
      const code = char.charCodeAt(0) + (HIRAGANA_START - KATAKANA_START);
      const hiraChar = String.fromCharCode(code);
      hira.push(hiraChar);
      previousKana = hiraChar;
    } else {
      // Pass non katakana chars through
      hira.push(char);
      previousKana = '';
    }
  }
  return hira.join('');
}

/**
 * Convert [Romaji](https://en.wikipedia.org/wiki/Romaji) to [Hiragana](https://en.wikipedia.org/wiki/Hiragana)
 * @param  {String} [input=''] text
 * @param  {Object} options used internally to pass along default options
 * @return {String} converted text
 * @example
 * romajiToHiragana('hiragana')
 * // => "ひらがな"
 * @ignore
 */
function romajiToHiragana(input = '', options = {}) {
  const text = input.toLowerCase(); // ensure hiragana
  return toKana(text, options);
}

/**
 * Convert input to [Hiragana](https://en.wikipedia.org/wiki/Hiragana)
 * @param  {String} [input=''] text
 * @param  {DefaultOptions} [options=defaultOptions]
 * @return {String} converted text
 * @example
 * toHiragana('toukyou, オオサカ')
 * // => 'とうきょう、　おおさか'
 * toHiragana('only カナ', { passRomaji: true })
 * // => 'only かな'
 * toHiragana('wi')
 * // => 'うぃ'
 * toHiragana('wi', { useObsoleteKana: true })
 * // => 'ゐ'
*/
function toHiragana(input = '', options = {}) {
  const config = Object.assign({}, DEFAULT_OPTIONS, options);
  if (config.passRomaji) return katakanaToHiragana(input);
  if (isRomaji(input)) return romajiToHiragana(input, config);
  if (isMixed(input, { passKanji: true })) {
    const romaji = katakanaToHiragana(input);
    return romajiToHiragana(romaji, config);
  }
  return katakanaToHiragana(input);
}

/**
 * Convert kana to romaji
 * @param  {String} kana text input
 * @param  {DefaultOptions} [options=defaultOptions]
 * @return {String} converted text
 * @example
 * toRomaji('ひらがな　カタカナ')
 * // => 'hiragana katakana'
 * toRomaji('げーむ　ゲーム')
 * // => 'ge-mu geemu'
 * toRomaji('ひらがな　カタカナ', { upcaseKatakana: true })
 * // => 'hiragana KATAKANA'
 * toRomaji('つじぎり', { customRomajiMapping: createCustomMapping({ じ: 'zi', つ: 'tu', り: 'li' }) });
 * // => 'tuzigili'
 */
function toRomaji(input = '', options = {}) {
  const config = Object.assign({}, DEFAULT_OPTIONS, options);
  // just throw away the substring index information and just concatenate all the kana
  return splitIntoRomaji(input, config)
    .map((romajiToken) => {
      const [start, end, romaji] = romajiToken;
      const makeUpperCase = options.upcaseKatakana && isKatakana(input.slice(start, end));
      return makeUpperCase ? romaji.toUpperCase() : romaji;
    })
    .join('');
}

function splitIntoRomaji(input, config) {
  let map = getKanaToRomajiTree(config);
  // TODO: accept object or function, if object, use createCustomMapping automatically?
  map = config.customRomajiMapping(map);
  return applyMapping(toHiragana(input, { passRomaji: true }), map, !config.IMEMode);
}

/**
 * Convert input to [Katakana](https://en.wikipedia.org/wiki/Katakana)
 * @param  {String} [input=''] text
 * @param  {DefaultOptions} [options=defaultOptions]
 * @return {String} converted text
 * @example
 * toKatakana('toukyou, おおさか')
 * // => 'トウキョウ、　オオサカ'
 * toKatakana('only かな', { passRomaji: true })
 * // => 'only カナ'
 * toKatakana('wi')
 * // => 'ウィ'
 * toKatakana('wi', { useObsoleteKana: true })
 * // => 'ヰ'
*/
function toKatakana(input = '', options = {}) {
  const config = Object.assign({}, DEFAULT_OPTIONS, options);
  if (config.passRomaji) return hiraganaToKatakana(input);
  if (isRomaji(input) || isMixed(input)) {
    const romaji = romajiToHiragana(input, config);
    return hiraganaToKatakana(romaji);
  }
  return hiraganaToKatakana(input);
}

/**
 * Tests a character. Returns true if the character is considered English punctuation.
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharEnglishPunctuation(char = '') {
  if (isEmpty(char)) return false;
  return EN_PUNCTUATION_RANGES.some(([start, end]) => isCharInRange(char, start, end));
}

/**
 * Tests a character. Returns true if the character is considered English punctuation.
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharJapanesePunctuation(char = '') {
  if (isEmpty(char)) return false;
  return JA_PUNCTUATION_RANGES.some(([start, end]) => isCharInRange(char, start, end));
}

/**
 * Tests a character. Returns true if the character is considered Japanese or English punctuation.
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharPunctuation(char = '') {
  if (isEmpty(char)) return false;
  return isCharEnglishPunctuation(char) || isCharJapanesePunctuation(char);
}

/**
 * Strips trailing [Okurigana](https://en.wikipedia.org/wiki/Okurigana) if `input` is a mix of [Kanji](https://en.wikipedia.org/wiki/Kanji) and [Kana](https://en.wikipedia.org/wiki/Kana)
 * @param  {String} input text
 * @param  {Object} [options={ all: false }] config object specifying if *all* kana should be removed, not just trailing okurigana
 * @return {String} text with okurigana removed
 * @example
 * stripOkurigana('踏み込む')
 * // => '踏み込'
 * stripOkurigana('粘り。')
 * // => '粘。'
 * stripOkurigana('お祝い')
 * // => 'お祝'
 * stripOkurigana('踏み込む', { all: true })
 * // => '踏込'
 * stripOkurigana('お祝い', { all: true })
 * // => '祝'
 */
function stripOkurigana(input = '', options = { all: false }) {
  if (isEmpty(input) || !isJapanese(input) || isKana(input)) return input;
  const chars = [...input];

  // strip every kana
  if (options.all) return chars.filter((char) => !isCharKana(char)).join('');

  // strip trailing only
  const reverseChars = chars.reverse();
  for (let i = 0, len = reverseChars.length; i < len; i += 1) {
    const char = reverseChars[i];
    // pass if it's punctuation
    if (isCharPunctuation(char)) continue; // eslint-disable-line no-continue
    // blank out if not kanji
    if (!isKanji(char)) {
      reverseChars[i] = '';
    } else break; // stop when we hit a kanji char
  }

  return reverseChars.reverse().join('');
}

// TODO: worth splitting into utils? so far not used anywhere else
function getType(input) {
  switch (true) {
    case (isCharJapanesePunctuation(input)): return 'japanesePunctuation';
    case (isCharKanji(input)): return 'kanji';
    case (isCharHiragana(input)): return 'hiragana';
    case (isCharKatakana(input)): return 'katakana';
    default: return 'romaji';
  }
}

/**
 * Splits input into array of [Kanji](https://en.wikipedia.org/wiki/Kanji), [Hiragana](https://en.wikipedia.org/wiki/Hiragana), [Katakana](https://en.wikipedia.org/wiki/Katakana), and [Romaji](https://en.wikipedia.org/wiki/Romaji) tokens.
 * Does not split into parts of speech!
 * @param  {String} input text
 * @return {Array} text split into tokens
 * @example
 * tokenize('ふふフフ')
 * // => ['ふふ', 'フフ']
 * tokenize('感じ')
 * // => ['感', 'じ']
 * tokenize('私は悲しい')
 * // => ['私', 'は', '悲', 'しい']
 * tokenize('what the...私は「悲しい」。')
 * // => ['what the...', '私', 'は', '「', '悲', 'しい', '」。']
 */
function tokenize(input = '') {
  if (isEmpty(input)) return [''];
  const chars = [...input];
  const head = chars.shift();
  let prevType = getType(head);

  const result = chars.reduce((tokens, char) => {
    const currType = getType(char);
    const sameType = currType === prevType;
    prevType = getType(char);
    if (sameType) {
      const prev = tokens.pop();
      return tokens.concat(prev.concat(char));
    }
    return tokens.concat(char);
  }, [head]);

  return result;
}

// IME event listener DOM helpers

export { bind, unbind, isRomaji, isJapanese, isKana, isHiragana, isKatakana, isMixed, isKanji, toRomaji, toKana, toHiragana, toKatakana, stripOkurigana, tokenize, createCustomMapping, methods };
