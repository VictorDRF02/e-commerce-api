export function createAuthMiddleware(authService) {
  /**
   * Verify the Bearer token before continuing with the request.
   * @param {import('express').Request} req - Express request.
   * @param {import('express').Response} res - Express response.
   * @param {import('express').NextFunction} next - Express next handler.
   * @returns {void}
   */
  return function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing Bearer token' });
    }

    const token = authHeader.slice(7).trim();

    try {
      req.auth = authService.verifyToken(token);
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}