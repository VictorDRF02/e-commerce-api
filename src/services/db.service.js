import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

export class DbService {
  constructor(dataFile) {
    this.dataFile = dataFile;
    this.db = {
      users: [],
      products: [],
    };
  }

  async init() {
    this.db = await this.load();
    this.db.users = this.withEnvUser(this.db.users);
    return this.db;
  }

  /**
   * Get the in-memory list of users.
   * @returns {Array<object>} User collection.
   */
  get users() {
    return this.db.users;
  }

  /**
   * Get the in-memory list of products.
   * @returns {Array<object>} Product collection.
   */
  get products() {
    return this.db.products;
  }

  /**
   * Find a user by username and password.
   * @param {string} username - User username.
   * @param {string} password - User password.
   * @returns {object|null} Matching user or null.
   */
  findUserByCredentials(username, password) {
    return this.users.find((item) => item.username === username && item.password === password) ?? null;
  }

  /**
   * Find a user by id.
   * @param {number} id - User id.
   * @returns {object|null} Matching user or null.
   */
  findUserById(id) {
    return this.users.find((item) => item.id === id) ?? null;
  }

  /**
   * Find a product by id.
   * @param {number} id - Product id.
   * @returns {object|null} Matching product or null.
   */
  findProductById(id) {
    return this.products.find((item) => item.id === id) ?? null;
  }

  /**
   * Create and store a normalized product.
   * @param {object} product - Raw product payload.
   * @returns {object} Stored product.
   */
  createProduct(product) {
    const nextId = this.nextProductId();
    const normalizedProduct = this.normalizeProduct({ ...product, id: nextId }, nextId);
    this.products.push(normalizedProduct);
    return normalizedProduct;
  }

  /**
   * Update a product by id.
   * @param {number} id - Product id.
   * @param {object} product - Partial product payload.
   * @returns {object|null} Updated product or null.
   */
  updateProduct(id, product) {
    const index = this.products.findIndex((item) => item.id === id);

    if (index < 0) {
      return null;
    }

    const updatedProduct = this.normalizeProduct({ ...this.products[index], ...product, id }, id);
    this.products[index] = updatedProduct;
    return updatedProduct;
  }

  /**
   * Delete a product by id.
   * @param {number} id - Product id.
   * @returns {object|null} Deleted product or null.
   */
  deleteProduct(id) {
    const index = this.products.findIndex((item) => item.id === id);

    if (index < 0) {
      return null;
    }

    const [deletedProduct] = this.products.splice(index, 1);
    return deletedProduct;
  }

  /**
   * Persist the current database state to disk.
   * @returns {Promise<void>}
   */
  async save() {
    await writeFile(this.dataFile, `${JSON.stringify(this.db, null, 2)}\n`, 'utf-8');
  }

  /**
   * Load the database state from disk.
   * @returns {Promise<object>} Database state.
   */
  async load() {
    if (!existsSync(this.dataFile)) {
      return { users: [], products: [] };
    }

    const raw = await readFile(this.dataFile, 'utf-8');
    return JSON.parse(raw);
  }

  /**
   * Add a user from environment variables when credentials are configured.
   * @param {Array<object>} users - Current user collection.
   * @returns {Array<object>} User collection with the env user, if configured.
   */
  withEnvUser(users) {
    const username = process.env.AUTH_USERNAME?.trim();
    const password = process.env.AUTH_PASSWORD?.trim();

    if (!username || !password) {
      return users;
    }

    const envUser = {
      id: Number(process.env.AUTH_USER_ID ?? this.nextUserId(users)),
      username,
      password,
      email: process.env.AUTH_EMAIL?.trim(),
      name: process.env.AUTH_NAME?.trim(),
      phone: process.env.AUTH_PHONE?.trim(),
    };

    return [
      ...users.filter((user) => user.username !== username),
      envUser,
    ];
  }

  /**
   * Compute the next user id.
   * @param {Array<object>} users - Current user collection.
   * @returns {number} Next id value.
   */
  nextUserId(users = this.users) {
    const maxId = users.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    return Math.max(1, maxId) + 1;
  }

  /**
   * Compute the next product id.
   * @returns {number} Next id value.
   */
  nextProductId() {
    const maxId = this.products.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    return Math.max(1, maxId) + 1;
  }

  /**
   * Normalize a product payload into the stored shape.
   * @param {object} product - Raw product payload.
   * @param {number} fallbackId - Id to use when the payload does not include one.
   * @returns {object} Normalized product.
   */
  normalizeProduct(product, fallbackId) {
    return {
      id: Number(product.id ?? fallbackId),
      title: String(product.title ?? '').trim(),
      price: Number(product.price ?? 0),
      description: String(product.description ?? '').trim(),
      category: String(product.category ?? '').trim(),
      image: String(product.image ?? 'placeholder.png').trim(),
      rating: product.rating
        ? {
            rate: Number(product.rating.rate ?? 0),
            count: Number(product.rating.count ?? 0),
          }
        : undefined,
      quantity: product.quantity ? Number(product.quantity) : undefined,
    };
  }
}