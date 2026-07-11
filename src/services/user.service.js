export class UserService {
  constructor(dbService) {
    this.dbService = dbService;
  }

  /**
   * Return all users.
   * @returns {Array<object>} User collection.
   */
  all() {
    return this.dbService.users;
  }

  /**
   * Get a user by id.
   * @param {number} id - User id.
   * @returns {object|null} Matching user or null.
   */
  getById(id) {
    return this.dbService.findUserById(id);
  }

  /**
   * Get a user by username and password.
   * @param {string} username - User username.
   * @param {string} password - User password.
   * @returns {object|null} Matching user or null.
   */
  getByCredentials(username, password) {
    return this.dbService.findUserByCredentials(username, password);
  }
}