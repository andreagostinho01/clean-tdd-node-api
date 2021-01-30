class LoginRouter {
  static route(httpRequest) {
    if (!httpRequest.body.email) return { statusCode: 400 };
    return true;
  }
}

describe('Login Router', () => {
  test('Should return 400 if no email is provided', () => {
    const sut = LoginRouter;

    const httpRequest = {
      body: {
        password: '123',
      },
    };

    const httpResponse = sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
  });
});
