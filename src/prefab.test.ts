import Config from './config';
import Identity from './identity';
import prefab from '../index';
import FetchMock from '../test/fetchMock';
import { DEFAULT_TIMEOUT } from './loader';

beforeEach(() => {
  prefab.loaded = false;
  prefab.configs = {};
});

describe('init', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runAllTimers();
  });

  it('works when the request is successful', async () => {
    const data = { values: { turbo: { double: 2.5 } } };

    FetchMock.mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }));

    const config = { apiKey: '1234', identity: new Identity('user', { device: 'desktop' }) };
    expect(prefab.loaded).toBe(false);

    await prefab.init(config);

    expect(prefab.configs).toEqual({
      turbo: new Config('turbo', 2.5, 'double'),
    });
    expect(prefab.loaded).toBe(true);
  });

  it('returns falsy responses for flag checks if it cannot load config', async () => {
    FetchMock.mock(() => Promise.reject(new Error('Network error')));

    const config = { apiKey: '1234', identity: new Identity('user', { device: 'desktop' }) };

    expect(prefab.loaded).toBe(false);

    prefab.init(config).catch((reason: any) => {
      expect(reason.message).toEqual('Network error');
      expect(prefab.configs).toEqual({});

      expect(prefab.isEnabled('foo')).toBe(false);
    });

    expect(prefab.loaded).toBe(false);
  });

  it('allows passing a timeout down to the loader', async () => {
    const data = { values: { turbo: { double: 2.5 } } };

    FetchMock.mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }));

    const config = { apiKey: '1234', identity: new Identity('user', { device: 'desktop' }) } as any;
    expect(prefab.loaded).toBe(false);

    await prefab.init(config);
    expect(prefab.loader?.timeout).toEqual(DEFAULT_TIMEOUT);

    const NEW_TIMEOUT = 123;
    config.timeout = NEW_TIMEOUT;

    await prefab.init(config);
    expect(prefab.loader?.timeout).toEqual(NEW_TIMEOUT);
  });
});

describe('setConfig', () => {
  it('works when types are provided', () => {
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

    expect(prefab.isEnabled('foo')).toBe(true);
    expect(prefab.get('turbo')).toEqual(2.5);
  });

  it('works when types are not provided', () => {
    expect(prefab.configs).toEqual({});

    prefab.setConfig({
      turbo: 2.5,

      foo: true,
    });

    expect(prefab.configs).toEqual({
      turbo: new Config('turbo', 2.5, 'unknown'),
      foo: new Config('foo', true, 'unknown'),
    });

    expect(prefab.isEnabled('foo')).toBe(true);
    expect(prefab.get('turbo')).toEqual(2.5);
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
