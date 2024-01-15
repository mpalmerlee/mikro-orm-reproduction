import { MikroORM } from '@mikro-orm/sqlite';
import { User } from './user.entity';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'sqlite.db',
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  orm.em.create(User, { name: 'Foo', email: 'foo' });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user.name).toBe('Foo');
  user.name = 'Bar';
  orm.em.remove(user);
  await orm.em.flush();

  const count = await orm.em.count(User, { email: 'foo' });
  expect(count).toBe(0);
});

test('upsert should not modify data object unless it is an entity', async () => {
  const data = { name: 'Foo', email: 'foo' };
  const user = orm.em.create(User, data);
  await orm.em.flush();
  orm.em.clear();

  expect(data).toMatchObject({ name: 'Foo', email: 'foo' });

  data.name = 'Bar';
  const newUser = await orm.em.upsert(User, data);

  expect(data).toMatchObject({ name: 'Bar', email: 'foo' });
  expect({ name: 'Bar', email: 'foo' }).toMatchObject(data);
});
