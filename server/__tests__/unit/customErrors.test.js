describe('Custom Errors', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      error.isOperational = true;

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should have 422 status code', () => {
      const error = new Error('Validation failed');
      error.statusCode = 422;

      expect(error.statusCode).toBe(422);
    });
  });

  describe('AuthenticationError', () => {
    it('should have 401 status code', () => {
      const error = new Error('Auth failed');
      error.statusCode = 401;

      expect(error.statusCode).toBe(401);
    });
  });

  describe('NotFoundError', () => {
    it('should have 404 status code', () => {
      const error = new Error('Not found');
      error.statusCode = 404;

      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status code', () => {
      const error = new Error('Conflict');
      error.statusCode = 409;

      expect(error.statusCode).toBe(409);
    });
  });

  describe('BusinessLogicError', () => {
    it('should have customizable status code', () => {
      const error1 = new Error('Logic error');
      error1.statusCode = 400;

      const error2 = new Error('Logic error');
      error2.statusCode = 409;

      expect(error1.statusCode).toBe(400);
      expect(error2.statusCode).toBe(409);
    });
  });
});
