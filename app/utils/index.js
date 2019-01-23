function getRandomUppercase(length = 1) {
  let text = '';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < length; i += 1) {
    text += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return text;
}

function getRandomNumber(length = 1) {
  return Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1));
}

function generateFullCodigo(codigo) {
  const prefixo = codigo.substring(0, 2);
  const numero = codigo.substring(2, 10);
  const sufixo = codigo.substring(10).trim();
  let retorno = numero;
  let dv;
  const multiplicadores = [8, 6, 4, 2, 3, 5, 9, 7];
  let soma = 0;

  if (codigo.length < 12) {
    throw new Error('could not calculate codigo');
  } else if (numero.length < 8 && codigo.length === 12) {
    let zeros = '';
    const diferenca = 8 - numero.length;
    for (let i = 0; i < diferenca; i += 1) {
      zeros += '0';
    }
    retorno = zeros + numero;
  } else {
    retorno = numero.substring(0, 8);
  }
  for (let i = 0; i < 8; i += 1) {
    soma += retorno.substring(i, i + 1) * multiplicadores[i];
  }
  const resto = soma % 11;
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

/* eslint-disable import/prefer-default-export */
export function generateCodigo() {
  return generateFullCodigo(`${getRandomUppercase(2)}${getRandomNumber(8)}${getRandomUppercase(2)}`);
}
