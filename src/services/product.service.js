export class ProductService {
  constructor(dbService) {
    this.dbService = dbService;
  }

  /**
   * Return all products.
   * @returns {Array<object>} Product collection.
   */
  all() {
    return this.dbService.products;
  }

  /**
   * Get a product by id.
   * @param {number} id - Product id.
   * @returns {object|null} Matching product or null.
   */
  getById(id) {
    return this.dbService.findProductById(id);
  }

  /**
   * Create a product.
   * @param {object} product - Raw product payload.
   * @returns {object} Stored product.
   */
  create(product) {
    return this.dbService.createProduct(product);
  }

  /**
   * Update a product by id.
   * @param {number} id - Product id.
   * @param {object} product - Partial product payload.
   * @returns {object|null} Updated product or null.
   */
  update(id, product) {
    return this.dbService.updateProduct(id, product);
  }

  /**
   * Delete a product by id.
   * @param {number} id - Product id.
   * @returns {object|null} Deleted product or null.
   */
  delete(id) {
    return this.dbService.deleteProduct(id);
  }
}