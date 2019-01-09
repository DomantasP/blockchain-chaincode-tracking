function getRandomLetter(length = 1) {
  let text = '';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < length; i += 1) {
    text += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return text;
}

function getRandomNumber(length = 1) {
  return Math.floor(Math.random() * 10 ** length);
}

export default function generateCode() {
  return `${getRandomLetter(2)}${getRandomNumber(8)} ${getRandomLetter(2)}`;
}
