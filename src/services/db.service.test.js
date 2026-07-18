import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DbService } from './db.service.js';

/**
 * Build a DbService instance whose Supabase client is fully mocked.
 * The `queryStub` function is called when `.from()` is invoked and
 * should return the chain object for the current query.
 */
function buildService(queryChain) {
  const service = new DbService();
  service.productsTable = 'products';
  service.supabase = {
    from: () => queryChain,
  };
  return service;
}

describe('DbService.listProducts', () => {
  it('orders products by updated_at DESC then id DESC', async () => {
    const orderedColumns = [];

    // Build a chainable mock that records .order() calls
    const chain = {
      select: () => chain,
      order: (column, options) => {
        orderedColumns.push({ column, ascending: options?.ascending ?? true });
        return chain;
      },
      // Simulate a successful Supabase response
      then: (resolve) => resolve({ data: [], error: null }),
    };
    // Make the chain thenable so `await` works correctly
    chain[Symbol.thennable] = undefined;

    // Patch `then` so `await chain` resolves as { data, error }
    const service = buildService(chain);

    // Override: make the chain awaitable by attaching `.then` properly
    chain.then = (resolve) => Promise.resolve({ data: [], error: null }).then(resolve);

    await service.listProducts();

    assert.equal(orderedColumns.length, 2, 'Expected exactly two .order() calls');
    assert.deepEqual(orderedColumns[0], { column: 'updated_at', ascending: false },
      'First order must be updated_at DESC');
    assert.deepEqual(orderedColumns[1], { column: 'id', ascending: false },
      'Second order must be id DESC (tiebreaker)');
  });

  it('returns the data array from Supabase', async () => {
    const products = [
      { id: 2, title: 'B', updated_at: '2024-01-02T00:00:00Z' },
      { id: 1, title: 'A', updated_at: '2024-01-01T00:00:00Z' },
    ];

    const chain = {
      select: () => chain,
      order: () => chain,
      then: (resolve) => Promise.resolve({ data: products, error: null }).then(resolve),
    };

    const service = buildService(chain);
    const result = await service.listProducts();

    assert.deepEqual(result, products, 'Should return the data returned by Supabase as-is');
  });

  it('returns an empty array when Supabase returns null data', async () => {
    const chain = {
      select: () => chain,
      order: () => chain,
      then: (resolve) => Promise.resolve({ data: null, error: null }).then(resolve),
    };

    const service = buildService(chain);
    const result = await service.listProducts();

    assert.deepEqual(result, [], 'Should return [] when Supabase data is null');
  });

  it('throws when Supabase returns an error', async () => {
    const chain = {
      select: () => chain,
      order: () => chain,
      then: (resolve) => Promise.resolve({ data: null, error: { message: 'DB error' } }).then(resolve),
    };

    const service = buildService(chain);
    await assert.rejects(
      () => service.listProducts(),
      (err) => {
        assert.ok(err.message.includes('Failed to list products'), 'Error message should include prefix');
        assert.ok(err.message.includes('DB error'), 'Error message should include original error');
        return true;
      }
    );
  });
});
