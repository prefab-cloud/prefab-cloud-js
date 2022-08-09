import Identity from './identity';
import Loader from './loader';

import FetchMock from '../test/fetchMock';

const identity = new Identity('test@example.com', { foo: 'bar' });
const apiKey = 'apiKey';

describe('overriding endpoints', () => {
  it('is supported by setting the endpoints before calling load', () => {
    const loader = new Loader({ identity, apiKey });

    expect(loader.endpoints).toStrictEqual([
      'https://api-prefab-cloud.global.ssl.fastly.net/api/v1',
      'https://api.prefab.cloud/api/v1',
    ]);

    loader.endpoints = [
      'https://example.global.ssl.fastly.net/api/v1',
      'https://example.com/api/v1',
    ];

    expect(loader.endpoints).toStrictEqual([
      'https://example.global.ssl.fastly.net/api/v1',
      'https://example.com/api/v1',
    ]);
  });
});

describe('load', () => {
  const data = {
    values: {
      turbo: {
        double: 2.5,
      },

      foo: {
        bool: true,
      },
    },
  };

  const success = Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });

  const failure = Promise.reject(new Error('Network error'));

  it('can succesfully return results from the first endpoint', async () => {
    const fetchMock = new FetchMock(() => success);

    const loader = new Loader({ identity, apiKey });

    const results = await loader.load();

    expect(fetchMock.requestCount).toStrictEqual(1);
    expect(results).toStrictEqual(data.values);
    expect(fetchMock.fetchedUrl?.host).toStrictEqual('api-prefab-cloud.global.ssl.fastly.net');
  });

  it('can successfully return from the second endpoint if the first fails', async () => {
    const fetchMock = new FetchMock(({ requestCount } : {requestCount: number}) => {
      if (requestCount < 2) {
        return failure;
      }

      return success;
    });

    const loader = new Loader({ identity, apiKey });

    const results = await loader.load();

    expect(fetchMock.requestCount).toStrictEqual(2);
    expect(results).toStrictEqual(data.values);
    expect(fetchMock.fetchedUrl?.host).toStrictEqual('api.prefab.cloud');
  });

  it('fails when no endpoints are reachable', async () => {
    const fetchMock = new FetchMock(() => failure);

    const loader = new Loader({ identity, apiKey });

    loader.load().catch((reason: any) => {
      expect(reason.message).toEqual('Network error');
      expect(fetchMock.requestCount).toStrictEqual(2);
      expect(fetchMock.fetchedUrl?.host).toStrictEqual('api.prefab.cloud');
    });
  });
});
