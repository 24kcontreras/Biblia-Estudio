import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Envuelve un handler async para que sus rechazos lleguen a next(err).
 * Express 4 (a diferencia de Express 5) no atrapa promesas rechazadas por su cuenta.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
