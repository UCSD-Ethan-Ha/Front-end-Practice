import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ErrorCode, ErrorResponse, FieldError } from './types.js';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields?: FieldError[],
  ) {
    super(message);
  }
}

// Errors raised by express.json() carry a `type` such as 'entity.parse.failed'.
function isBodyParserError(err: unknown): err is { type: string } {
  return typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string';
}

function toHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;
  if (isBodyParserError(err)) {
    if (err.type === 'entity.parse.failed') return new HttpError(400, 'bad_request', 'Request body is not valid JSON');
    if (err.type === 'entity.too.large') return new HttpError(413, 'payload_too_large', 'Request body is too large');
  }
  console.error(err);
  return new HttpError(500, 'internal', 'Internal server error');
}

export const notFound: RequestHandler = (req) => {
  throw new HttpError(404, 'not_found', `No route for ${req.method} ${req.path}`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { status, code, message, fields } = toHttpError(err);
  const body: ErrorResponse = { error: { message, code, ...(fields && { fields }) } };
  res.status(status).json(body);
};
