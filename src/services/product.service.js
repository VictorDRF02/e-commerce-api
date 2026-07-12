export class ProductService {
  constructor(dbService) {
    this.dbService = dbService;
  }

  /**
   * Return all products.
    * @returns {Promise<Array<object>>} Product collection.
   */
  async all() {
    return this.dbService.listProducts();
  }

  /**
   * Get a product by id.
   * @param {number} id - Product id.
    * @returns {Promise<object|null>} Matching product or null.
   */
  async getById(id) {
    return this.dbService.findProductById(id);
  }

  /**
   * Create a product.
   * @param {object} product - Raw product payload.
    * @returns {Promise<object>} Stored product.
   */
  async create(product) {
    return this.dbService.createProduct(product);
  }

  /**
   * Update a product by id.
   * @param {number} id - Product id.
   * @param {object} product - Partial product payload.
    * @returns {Promise<object|null>} Updated product or null.
   */
  async update(id, product) {
    return this.dbService.updateProduct(id, product);
  }

  /**
   * Delete a product by id.
   * @param {number} id - Product id.
   * @returns {Promise<object|null>} Deleted product or null.
   */
  async delete(id) {
    return this.dbService.deleteProduct(id);
  }
}