import { createClient } from '@supabase/supabase-js';

export class DbService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.productsTable = process.env.SUPABASE_PRODUCTS_TABLE ?? 'products';
    this.usersTable = process.env.SUPABASE_USERS_TABLE ?? 'users';
    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'uploads';
    this.supabase = null;
  }

  /**
   * Initialize the Supabase client with service role credentials.
   * @returns {Promise<void>} Resolves when the client is ready.
   */
  async init() {
    if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Fetch all users and append the optional fallback env user.
   * @returns {Promise<Array<object>>} User collection.
   */
  async listUsers() {
    const { data, error } = await this.supabase
      .from(this.usersTable)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Find a user by username and password.
   * @param {string} username - User username.
   * @param {string} password - User password.
   * @returns {Promise<object|null>} Matching user or null.
   */
  async findUserByCredentials(username, password) {
    const { data, error } = await this.supabase
      .from(this.usersTable)
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find user by credentials: ${error.message}`);
    }

    if (data) {
      return data;
    }

    return null;
  }

  /**
   * Find a user by id.
   * @param {number} id - User id.
   * @returns {Promise<object|null>} Matching user or null.
   */
  async findUserById(id) {
    const { data, error } = await this.supabase
      .from(this.usersTable)
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find user by id: ${error.message}`);
    }

    if (data) {
      return data;
    }
  
    return null;
  }

  /**
   * Fetch all products sorted by updated_at descending (most recently updated first),
   * with id descending as a stable tiebreaker.
   * @returns {Promise<Array<object>>} Product collection.
   */
  async listProducts() {
    const { data, error } = await this.supabase
      .from(this.productsTable)
      .select('*')
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      throw new Error(`Failed to list products: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Find a product by id.
   * @param {number} id - Product id.
   * @returns {Promise<object|null>} Matching product or null.
   */
  async findProductById(id) {
    const { data, error } = await this.supabase
      .from(this.productsTable)
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find product by id: ${error.message}`);
    }

    return data ?? null;
  }

  /**
   * Create a product row in Supabase.
   * @param {object} product - Raw product payload.
   * @returns {Promise<object>} Stored product.
   */
  async createProduct(product) {
    const normalizedProduct = this.normalizeProduct(product);
    const { data, error } = await this.supabase
      .from(this.productsTable)
      .insert(normalizedProduct)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a product by id.
   * @param {number} id - Product id.
   * @param {object} product - Partial product payload.
   * @returns {Promise<object|null>} Updated product or null when not found.
   */
  async updateProduct(id, product) {
    const currentProduct = await this.findProductById(id);
    if (!currentProduct) {
      return null;
    }

    const normalizedProduct = this.normalizeProduct({ ...currentProduct, ...product, id });
    delete normalizedProduct.id;

    const { data, error } = await this.supabase
      .from(this.productsTable)
      .update(normalizedProduct)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data ?? null;
  }

  /**
   * Delete a product by id.
   * @param {number} id - Product id.
   * @returns {Promise<object|null>} Deleted product or null when not found.
   */
  async deleteProduct(id) {
    const { data, error } = await this.supabase
      .from(this.productsTable)
      .delete()
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }

    return data ?? null;
  }

  /**
   * Upload an image to Supabase Storage and return its public URL.
   * @param {object} params - Upload payload.
   * @param {Buffer} params.fileBuffer - File bytes in memory.
   * @param {string} params.contentType - MIME type.
   * @param {string} params.extension - File extension including dot.
   * @returns {Promise<{filename: string, url: string}>} Uploaded object metadata.
   */
  async uploadImage({ fileBuffer, contentType, extension }) {
    const safeExtension = extension ? extension.toLowerCase() : '';
    const objectName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.storageBucket)
      .upload(objectName, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data } = this.supabase.storage.from(this.storageBucket).getPublicUrl(objectName);
    return {
      filename: objectName,
      url: data.publicUrl,
    };
  }

  /**
   * Return the public URL for a stored image by filename.
   * @param {string} filename - Storage object filename.
   * @returns {string} Public URL of the stored image.
   */
  getImageUrl(filename) {
    if (!filename || typeof filename !== 'string' || !filename.trim()) {
      throw new Error('filename is required');
    }

    const { data } = this.supabase.storage.from(this.storageBucket).getPublicUrl(filename.trim());
    return data.publicUrl;
  }

  /**
   * Normalize product payload into the persisted shape.
   * @param {object} product - Raw product payload.
   * @returns {object} Normalized product.
   */
  normalizeProduct(product) {
    return {
      ...(product.id ? { id: Number(product.id) } : {}),
      title: String(product.title ?? '').trim(),
      price: Number(product.price ?? 0),
      description: String(product.description ?? '').trim(),
      category: String(product.category ?? '').trim(),
      image: String(product.image ?? 'placeholder.png').trim()
    };
  }
}