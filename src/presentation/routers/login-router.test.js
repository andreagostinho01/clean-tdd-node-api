const LoginRouter = require('./login-router');
const MissingParamError = require('../errors/missing-param-error');
const InvalidParamError = require('../errors/invalid-param-error');
const UnauthorizedError = require('../errors/unauthorized-error');
const ServerError = require('../errors/server-error');

const makeAuthUseCase = () => {
  class AuthUseCaseSpy {
    async auth(email, password) {
      this.email = email;
      this.password = password;

      return this.accessToken;
    }
  }

  return new AuthUseCaseSpy();
};

const makeAuthUseCaseWithError = () => {
  class AuthUseCaseSpy {
    async auth() {
      throw new Error();
    }
  }

  return new AuthUseCaseSpy();
};

const makeEmailValidator = () => {
  class EmailValidatorSpy {
    async validate(email) {
      this.email = email;
      return this.isEmailValid;
    }
  }

  const emailValidatorSpy = new EmailValidatorSpy();
  emailValidatorSpy.isEmailValid = true;
  return emailValidatorSpy;
};

const makeEmailValidatorWithError = () => {
  class EmailValidatorSpy {
    async validate(email) {
      throw new Error();
    }
  }

  return new EmailValidatorSpy();
};

const makeSut = () => {
  const authUseCaseSpy = makeAuthUseCase();
  const emailValidatorSpy = makeEmailValidator();
  authUseCaseSpy.accessToken = 'valid_token';

  const sut = new LoginRouter(authUseCaseSpy, emailValidatorSpy);

  return {
    sut,
    authUseCaseSpy,
    emailValidatorSpy,
  };
};

describe('Login Router', () => {
  test('Should return 500 if no httpRequest is provided', async () => {
    const { sut } = makeSut();
    const httpResponse = await sut.route();

    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 500 if httpRequest has no body', async () => {
    const { sut } = makeSut();

    const httpRequest = {};

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 400 if no email is provided', async () => {
    const { sut } = makeSut();

    const httpRequest = {
      body: {
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);

    /* 
      use toEqual to compare objects because it doesn't compare the pointers, 
      only the values 
    */
    expect(httpResponse.body).toEqual(new MissingParamError('email'));
  });

  test('Should return 400 if an invalid email is provided', async () => {
    const { sut, emailValidatorSpy } = makeSut();
    emailValidatorSpy.isEmailValid = false;

    const httpRequest = {
      body: {
        email: 'invalid@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new InvalidParamError('email'));
  });

  test('Should return 500 if no EmailValidator is provided', async () => {
    const authUseCaseSpy = makeAuthUseCase();

    const sut = new LoginRouter(authUseCaseSpy);

    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 500 if EmailValidator has no validate method', async () => {
    class EmailValidatorSpy {}
    const emailValidatorSpy = new EmailValidatorSpy();

    const authUseCaseSpy = makeAuthUseCase();

    const sut = new LoginRouter(authUseCaseSpy, emailValidatorSpy);

    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 500 if EmailValidator throws an error', async () => {
    const authUseCaseSpy = makeAuthUseCase();
    const emailValidatorSpy = makeEmailValidatorWithError();

    const sut = new LoginRouter(authUseCaseSpy, emailValidatorSpy);

    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
  });

  test('Should call EmailValidator with correct email', async () => {
    const { sut, emailValidatorSpy } = makeSut();

    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    await sut.route(httpRequest);

    expect(emailValidatorSpy.email).toBe(httpRequest.body.email);
  });

  test('Should return 400 if no password is provided', async () => {
    const { sut } = makeSut();

    const httpRequest = {
      body: {
        email: 'any_email',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);

    /* 
      use toEqual to compare objects because it doesn't compare the pointers, 
      only the values 
    */
    expect(httpResponse.body).toEqual(new MissingParamError('password'));
  });

  test('Should call AuthUseCase with correct params', async () => {
    const { sut, authUseCaseSpy } = makeSut();

    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    await sut.route(httpRequest);

    expect(authUseCaseSpy.email).toBe(httpRequest.body.email);
    expect(authUseCaseSpy.password).toBe(httpRequest.body.password);
  });

  test('Should return 401 when invalid credentials are provided', async () => {
    const { sut, authUseCaseSpy } = makeSut();
    authUseCaseSpy.accessToken = '';

    const httpRequest = {
      body: {
        email: 'invalid@email.com',
        password: 'invalid_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(401);
    expect(httpResponse.body).toEqual(new UnauthorizedError());
  });

  test('Should return 200 when valid credentials are provided', async () => {
    const { sut, authUseCaseSpy } = makeSut();

    const httpRequest = {
      body: {
        email: 'valid@email.com',
        password: 'valid_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(200);
    expect(httpResponse.body.accessToken).toEqual(authUseCaseSpy.accessToken);
  });

  test('Should return 500 if no AuthUseCase is provided', async () => {
    const sut = new LoginRouter();

    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 500 if AuthUseCase has no auth method', async () => {
    class AuthUseCaseSpy {}
    const authUseCaseSpy = new AuthUseCaseSpy();
    const sut = new LoginRouter(authUseCaseSpy);

    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 500 if AuthUseCase throws an error', async () => {
    const authUseCaseSpy = makeAuthUseCaseWithError();

    const sut = new LoginRouter(authUseCaseSpy);

    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
  });
});
