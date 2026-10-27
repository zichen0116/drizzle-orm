import { describe, expect, it } from 'vitest';
import { gelTable, integer as gelInteger, QueryBuilder as GelQueryBuilder } from '~/gel-core';
import { int, mysqlTable, QueryBuilder as MySqlQueryBuilder } from '~/mysql-core';
import { integer, pgTable, QueryBuilder, text } from '~/pg-core';
import { int as singlestoreInt, QueryBuilder as SingleStoreQueryBuilder, singlestoreTable } from '~/singlestore-core';
import { eq } from '~/sql';
import { integer as sqliteInteger, QueryBuilder as SQLiteQueryBuilder, sqliteTable } from '~/sqlite-core';

const items = pgTable('items', { id: integer('id'), kind: text('kind') });

describe('offset', () => {
	it('preserves a Postgres subquery with offset zero in a join', () => {
		const qb = new QueryBuilder();
		const candidates = qb.select({ id: items.id }).from(items)
			.where(eq(items.kind, 'candidate')).offset(0).as('candidates');
		const query = qb.select({ id: items.id }).from(items)
			.innerJoin(candidates, eq(items.id, candidates.id)).toSQL();

		expect(query.sql).toContain('inner join (select');
		expect(query.sql).toContain('offset $2) "candidates"');
		expect(query.params).toEqual(['candidate', 0]);
	});

	it.each([0, 5])('includes a Postgres offset of %i', (offset) => {
		const query = new QueryBuilder().select().from(items).offset(offset).toSQL();

		expect(query.sql).toMatch(/ offset \$1$/);
		expect(query.params).toEqual([offset]);
	});

	it('omits the Postgres offset when none is specified', () => {
		const query = new QueryBuilder().select().from(items).toSQL();

		expect(query.sql).not.toContain('offset');
		expect(query.params).toEqual([]);
	});

	it('includes a MySQL offset of zero', () => {
		const table = mysqlTable('items', { id: int('id') });
		const query = new MySqlQueryBuilder().select().from(table).offset(0).toSQL();

		expect(query.sql).toMatch(/ offset \?$/);
		expect(query.params).toEqual([0]);
	});

	it('includes a SQLite offset of zero', () => {
		const table = sqliteTable('items', { id: sqliteInteger('id') });
		const query = new SQLiteQueryBuilder().select().from(table).offset(0).toSQL();

		expect(query.sql).toMatch(/ offset \?$/);
		expect(query.params).toEqual([0]);
	});

	it('includes a Gel offset of zero', () => {
		const table = gelTable('items', { value: gelInteger('value') });
		const query = new GelQueryBuilder().select().from(table).offset(0).toSQL();

		expect(query.sql).toMatch(/ offset \$1$/);
		expect(query.params).toEqual([0]);
	});

	it('includes a SingleStore offset of zero', () => {
		const table = singlestoreTable('items', { id: singlestoreInt('id') });
		const query = new SingleStoreQueryBuilder().select().from(table).offset(0).toSQL();

		expect(query.sql).toMatch(/ offset \?$/);
		expect(query.params).toEqual([0]);
	});

	it('includes an outer Postgres union offset of zero', () => {
		const qb = new QueryBuilder();
		const query = qb.select().from(items).union(qb.select().from(items)).offset(0).toSQL();

		expect(query.sql).toContain('union');
		expect(query.sql).toMatch(/ offset \$1$/);
		expect(query.params).toEqual([0]);
	});
});
