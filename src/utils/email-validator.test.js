const validator = require('validator');

class EmailValidator {
  async isValid(email) {
    return validator.isEmail(email);
  }
}

const makeSut = () => new EmailValidator();

describe('Email Validator', () => {
  test('Should return true if validator returns true', async () => {
    const sut = makeSut();
    const isEmailValid = await sut.isValid('valid@email.com');

    expect(isEmailValid).toBe(true);
  });

  test('Should return false if validator returns false', async () => {
    validator.isEmailValid = false;

    const sut = makeSut();
    const isEmailValid = await sut.isValid('invalid@email.com');

    expect(isEmailValid).toBe(false);
  });
});
