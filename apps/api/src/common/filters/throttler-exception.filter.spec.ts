import { ThrottlerExceptionFilter } from './throttler-exception.filter';
import { ThrottlerException } from '@nestjs/throttler';

describe('ThrottlerExceptionFilter', () => {
  let filter: ThrottlerExceptionFilter;

  beforeEach(() => {
    filter = new ThrottlerExceptionFilter();
  });

  it('debe retornar 429 con mensaje en español y retryAfter', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    };

    const exception = new ThrottlerException('Too Many Requests');
    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED',
          message: expect.stringContaining('Demasiadas solicitudes'),
        }),
      }),
    );
  });

  it('debe incluir retryAfter en los detalles', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    };

    const exception = new ThrottlerException('Too Many Requests');
    filter.catch(exception, mockHost as any);

    const body = mockResponse.json.mock.calls[0][0];
    expect(body.error.details).toHaveProperty('retryAfter');
    expect(typeof body.error.details.retryAfter).toBe('number');
    expect(body.error.details.retryAfter).toBeGreaterThan(0);
  });
});
