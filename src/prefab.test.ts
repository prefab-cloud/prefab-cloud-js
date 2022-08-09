import Config from './config';
import Identity from './identity';
import prefab from '../index';
import FetchMock from '../test/fetchMock';

beforeEach(() => {
  prefab.configs = {};
});

describe('init', () => {
  it('works when the request is successful', async () => {
    const data = { values: { turbo: { double: 2.5 } } };

    FetchMock.mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }));

    const config = { apiKey: '1234', identity: new Identity('user', { device: 'desktop' }) };

    await prefab.init(config);

    expect(prefab.configs).toEqual({
      turbo: new Config('turbo', 2.5, 'double'),
    });
  });

  it('returns falsy responses for flag checks if it cannot load config', async () => {
    FetchMock.mock(() => Promise.reject(new Error('Network error')));

    const config = { apiKey: '1234', identity: new Identity('user', { device: 'desktop' }) };

    prefab.init(config).catch((reason: any) => {
      expect(reason.message).toEqual('Network error');
      expect(prefab.configs).toEqual({});

      expect(prefab.isEnabled('foo')).toBe(false);
    });
  });
});

test('setConfig', () => {
  expect(prefab.configs).toEqual({});

  prefab.setConfig({
    turbo: {
      double: 2.5,
    },

    foo: {
      bool: true,
    },
  });

  expect(prefab.configs).toEqual({
    turbo: new Config('turbo', 2.5, 'double'),
    foo: new Config('foo', true, 'bool'),
  });
});

test('get', () => {
  prefab.setConfig({
    turbo: {
      double: 2.5,
    },
  });

  expect(prefab.get('turbo')).toEqual(2.5);
});

test('isEnabled', () => {
  // it is false when no config is loaded
  expect(prefab.isEnabled('foo')).toBe(false);

  prefab.setConfig({
    foo: {
      bool: true,
    },
  });

  expect(prefab.isEnabled('foo')).toBe(true);
});
