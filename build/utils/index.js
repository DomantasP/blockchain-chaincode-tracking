'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = generateCode;
function getRandomLetter() {
  var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

  var text = '';
  var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (var i = 0; i < length; i += 1) {
    text += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return text;
}

function getRandomNumber() {
  var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

  return Math.floor(Math.random() * 10 ** length);
}

function generateCode() {
  return '' + getRandomLetter(2) + getRandomNumber(8) + ' ' + getRandomLetter(2);
}
//# sourceMappingURL=index.js.map