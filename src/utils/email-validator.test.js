const validator = require('validator');
const EmailValidator = require('./email-validator');

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

  test('Should call validator with correct email', async () => {
    const sut = makeSut();
    await sut.isValid('any@email.com');

    expect(validator.email).toBe('any@email.com');
  });
});
