const jwt = require('jsonwebtoken');
const { validateJWT } = require('./jwt');

describe('JWT Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('Missing token', () => {
    it('should return 401 when Authorization header is missing', () => {
      validateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          code: 'MISSING_TOKEN',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid header format', () => {
    it('should return 401 when Authorization header format is invalid', () => {
      req.headers.authorization = 'InvalidFormat';

      validateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          code: 'INVALID_TOKEN',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer token is missing', () => {
      req.headers.authorization = 'Bearer';

      validateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_TOKEN',
        })
      );
    });
  });

  describe('Valid token', () => {
    it('should attach user context and call next() with valid token', () => {
      const token = jwt.sign(
        { userId: 'user-123', role: 'CUSTOMER' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256' }
      );
      req.headers.authorization = `Bearer ${token}`;

      validateJWT(req, res, next);

      expect(req.user).toEqual({
        userId: 'user-123',
        role: 'CUSTOMER',
      });
      expect(req.headers['X-User-Id']).toBe('user-123');
      expect(req.headers['X-User-Role']).toBe('CUSTOMER');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle token with sub claim instead of userId', () => {
      const token = jwt.sign(
        { sub: 'user-456', role: 'AGENT' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256' }
      );
      req.headers.authorization = `Bearer ${token}`;

      validateJWT(req, res, next);

      expect(req.user.userId).toBe('user-456');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Invalid token signature', () => {
    it('should return 401 when token signature is invalid', () => {
      const token = jwt.sign(
        { userId: 'user-123', role: 'CUSTOMER' },
        'wrong-secret',
        { algorithm: 'HS256' }
      );
      req.headers.authorization = `Bearer ${token}`;

      validateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          code: 'INVALID_TOKEN',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Missing token claims', () => {
    it('should return 401 when userId is missing', () => {
      const token = jwt.sign(
        { role: 'CUSTOMER' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256' }
      );
      req.headers.authorization = `Bearer ${token}`;

      validateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          code: 'INVALID_TOKEN',
        })
      );
    });

    it('should return 401 when role is missing', () => {
      const token = jwt.sign(
        { userId: 'user-123' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256' }
      );
      req.headers.authorization = `Bearer ${token}`;

      validateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
