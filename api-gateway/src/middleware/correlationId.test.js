const { correlationIdMiddleware } = require('./correlationId');

describe('Correlation ID Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      setHeader: jest.fn(),
    };
    next = jest.fn();
  });

  it('should generate correlationId when not provided', () => {
    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(typeof req.correlationId).toBe('string');
    expect(req.correlationId.length).toBeGreaterThan(0);
    expect(next).toHaveBeenCalled();
  });

  it('should use existing correlationId from header', () => {
    const existingId = 'existing-correlation-id-123';
    req.headers['x-correlation-id'] = existingId;

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBe(existingId);
    expect(next).toHaveBeenCalled();
  });

  it('should attach correlationId to response header', () => {
    correlationIdMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      req.correlationId
    );
  });
});
