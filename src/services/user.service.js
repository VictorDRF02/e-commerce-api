export class UserService {
  constructor(dbService) {
    this.dbService = dbService;
  }

  /**
   * Remove sensitive fields from a user record.
   * @param {object|null} user - User record.
   * @returns {object|null} Sanitized user or null.
   */
  sanitize(user) {
    if (!user) {
      return null;
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Return all users.
    * @returns {Promise<Array<object>>} User collection.
   */
  async all() {
    const users = await this.dbService.listUsers();
    return users.map((user) => this.sanitize(user));
  }

  /**
   * Get a user by id.
   * @param {number} id - User id.
    * @returns {Promise<object|null>} Matching user or null.
   */
  async getById(id) {
    const user = await this.dbService.findUserById(id);
    return this.sanitize(user);
  }

  /**
   * Get a user by username and password.
   * @param {string} username - User username.
   * @param {string} password - User password.
    * @returns {Promise<object|null>} Matching user or null.
   */
  async getByCredentials(username, password) {
    return this.dbService.findUserByCredentials(username, password);
  }
}