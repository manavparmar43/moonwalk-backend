const CryptoJS = require('crypto-js');
const { secretKey } = require('../config/envConfig');

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

function decrypt(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
