import test from 'node:test';
import assert from 'node:assert/strict';
import { DbService } from './db.service.js';

test('listProducts orders by updated_at desc and id desc', async () => {
  const dbService = new DbService();
  const orderCalls = [];
  const query = {
    select(columns) {
      assert.equal(columns, '*');
      return query;
    },
    order(column, options) {
      orderCalls.push({ column, options });
      if (orderCalls.length === 2) {
        return {
          data: [{ id: 2 }, { id: 1 }],
          error: null,
        };
      }

      return query;
    },
  };

  dbService.supabase = {
    from(tableName) {
      assert.equal(tableName, dbService.productsTable);
      return query;
    },
  };

  const products = await dbService.listProducts();

  assert.deepEqual(products, [{ id: 2 }, { id: 1 }]);
  assert.deepEqual(orderCalls, [
    { column: 'updated_at', options: { ascending: false } },
    { column: 'id', options: { ascending: false } },
  ]);
});

test('listProducts throws when query fails', async () => {
  const dbService = new DbService();
  const query = {
    select() {
      return query;
    },
    order() {
      return {
        order() {
          return {
            data: null,
            error: { message: 'boom' },
          };
        },
      };
    },
  };

  dbService.supabase = {
    from() {
      return query;
    },
  };

  await assert.rejects(
    () => dbService.listProducts(),
    /Failed to list products: boom/,
  );
});
