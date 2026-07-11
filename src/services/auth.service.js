import jwt from 'jsonwebtoken';

export class AuthService {
  constructor(userService, jwtSecret) {
    this.userService = userService;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Authenticate a user and issue a JWT.
   * @param {string} username - User username.
   * @param {string} password - User password.
   * @returns {{token: string}|null} Login response or null.
   */
  login(username, password) {
    const user = this.userService.getByCredentials(username, password);

    if (!user) {
      return null;
    }

    const token = jwt.sign(
      {
        sub: String(user.id),
        username: user.username,
      },
      this.jwtSecret,
      { expiresIn: '1d' }
    );

    return { token };
  }

  /**
   * Validate a JWT and return its decoded payload.
   * @param {string} token - Bearer token without the prefix.
   * @returns {object} Decoded token payload.
   */
  verifyToken(token) {
    return jwt.verify(token, this.jwtSecret);
  }
}