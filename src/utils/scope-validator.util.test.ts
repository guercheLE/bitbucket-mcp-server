import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('ScopeValidator', () => {
  let ScopeValidator: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Import the class after mocking
    const { ScopeValidator: ScopeValidatorClass } = require('./scope-validator.util');
    ScopeValidator = ScopeValidatorClass;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateScope', () => {
    it('should return true for valid scopes', () => {
      const validScopes = [
        'repository:read',
        'repository:write',
        'pullrequest:read',
        'pullrequest:write',
        'workspace:read',
        'workspace:write',
      ];

      validScopes.forEach(scope => {
        expect(ScopeValidator.validateScope(scope)).toBe(true);
      });
    });

    it('should return false for invalid scopes', () => {
      const invalidScopes = [
        'invalid:scope',
        'repository:invalid',
        'pullrequest:',
        ':read',
        '',
        'repository:read:write',
      ];

      invalidScopes.forEach(scope => {
        expect(ScopeValidator.validateScope(scope)).toBe(false);
      });
    });
  });

  describe('validateScopes', () => {
    it('should return true for array of valid scopes', () => {
      const scopes = ['repository:read', 'pullrequest:write'];
      expect(ScopeValidator.validateScopes(scopes)).toBe(true);
    });

    it('should return false for array with invalid scopes', () => {
      const scopes = ['repository:read', 'invalid:scope'];
      expect(ScopeValidator.validateScopes(scopes)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(ScopeValidator.validateScopes([])).toBe(true);
    });
  });

  describe('getRequiredScopes', () => {
    it('should return required scopes for basic operations', () => {
      const requiredScopes = ScopeValidator.getRequiredScopes();

      expect(Array.isArray(requiredScopes)).toBe(true);
      expect(requiredScopes.length).toBeGreaterThan(0);
      expect(requiredScopes.every((scope: string) => ScopeValidator.validateScope(scope))).toBe(
        true
      );
    });
  });

  describe('class instantiation', () => {
    it('should create instance without errors', () => {
      expect(() => new ScopeValidator()).not.toThrow();
    });

    it('should have required methods', () => {
      const validator = new ScopeValidator();

      expect(typeof validator.validateScope).toBe('function');
      expect(typeof validator.validateScopes).toBe('function');
      expect(typeof validator.getRequiredScopes).toBe('function');
    });
  });
});
