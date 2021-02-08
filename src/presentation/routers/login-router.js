const HttpResponse = require('../helpers/http-response');
const { InvalidParamError, MissingParamError } = require('../errors');

module.exports = class LoginRouter {
  constructor(authUseCase, emailValidator) {
    this.authUseCase = authUseCase;
    this.emailValidator = emailValidator;
  }

  async route(httpRequest) {
    try {
      const { email, password } = httpRequest.body;

      if (!email)
        return HttpResponse.badRequest(new MissingParamError('email'));

      if (!(await this.emailValidator.validate(email)))
        return HttpResponse.badRequest(new InvalidParamError('email'));

      if (!password)
        return HttpResponse.badRequest(new MissingParamError('password'));

      const accessToken = await this.authUseCase.auth(email, password);

      if (!accessToken) return HttpResponse.unauthorizedError();

      return HttpResponse.ok({ accessToken });
    } catch (error) {
      return HttpResponse.serverError();
    }
  }
};
