'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRandomId = getRandomId;
exports.generateCodigo = generateCodigo;
function getRandomUppercase() {
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

  return Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)); // removed the 0 possibility was causing length problem
  // return Math.floor(Math.random() * 10 ** length);
}

function getRandomId() {
  var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

  var text = '';
  var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < length; i += 1) {
    text += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return text;
}

function generateFullCodigo(codigo) {
  var prefixo = codigo.substring(0, 2);
  var numero = codigo.substring(2, 10);
  var sufixo = codigo.substring(10).trim();
  var retorno = numero;
  var dv = void 0;
  var multiplicadores = [8, 6, 4, 2, 3, 5, 9, 7];
  var soma = 0;
  // Preenche número com 0 à esquerda
  if (codigo.length < 12) {
    throw new Error('could not calculate codigo');
  } else if (numero.length < 8 && codigo.length === 12) {
    var zeros = '';
    var diferenca = 8 - numero.length;
    for (var i = 0; i < diferenca; i += 1) {
      zeros += '0';
    }
    retorno = zeros + numero;
  } else {
    retorno = numero.substring(0, 8);
  }
  for (var _i = 0; _i < 8; _i += 1) {
    soma += retorno.substring(_i, _i + 1) * multiplicadores[_i];
  }
  var resto = soma % 11;
  if (resto === 0) {
    dv = '5';
  } else if (resto === 1) {
    dv = '0';
  } else {
    dv = (11 - resto).toString();
  }
  retorno += dv;
  retorno = prefixo + retorno + sufixo;
  return retorno;
}

function generateCodigo() {
  return generateFullCodigo('' + getRandomUppercase(2) + getRandomNumber(8) + getRandomUppercase(2));
}
//# sourceMappingURL=index.js.map