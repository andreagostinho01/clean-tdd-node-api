const HttpResponse = require('../helpers/http-response');
const InvalidParamError = require('../helpers/errors/invalid-param-error');
const MissingParamError = require('../helpers/errors/missing-param-error');

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
      console.error(error);
      return HttpResponse.serverError();
    }
  }
};
