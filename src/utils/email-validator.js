const validator = require('validator');

module.exports = class EmailValidator {
  async isValid(email) {
    return validator.isEmail(email);
  }
};
