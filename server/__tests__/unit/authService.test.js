import { register, login, getProfile } from '../../src/services/authService.js';
import { ConflictError, AuthenticationError } from '../../src/utils/customErrors.js';

// Basic smoke tests to verify module exports and error handling work
describe('Auth Service', () => {
  describe('register', () => {
    it('should be a function', () => {
      expect(typeof register).toBe('function');
    });
  });

  describe('login', () => {
    it('should be a function', () => {
      expect(typeof login).toBe('function');
    });
  });

  describe('getProfile', () => {
    it('should be a function', () => {
      expect(typeof getProfile).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should have ConflictError class', () => {
      const error = new ConflictError('Test');
      expect(error.message).toBe('Test');
      expect(error.statusCode).toBe(409);
    });

    it('should have AuthenticationError class', () => {
      const error = new AuthenticationError('Test');
      expect(error.message).toBe('Test');
      expect(error.statusCode).toBe(401);
    });
  });
});
