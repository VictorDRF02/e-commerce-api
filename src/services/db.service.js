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