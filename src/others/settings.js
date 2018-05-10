export const channelsDomElementId = 'channel6b7e4156C20011e7Abc4Cec278b6b50a';
export const frequencyAndSideAndTypeToAttributeName = (frequency, side, type) => `${type==='lock'? 'l': 'm'}${side === 'content'? 'c': 'i'}${frequency}`;
export const attributeNameToFrequencyAndSideAndType = (attributeName) => [
  attributeName.slice(2),
  attributeName.charAt(1) === 'c'? 'content': 'inject',
  attributeName.charAt(0) === 'l'? 'lock': 'message',
];
