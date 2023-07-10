import fetchMock, {enableFetchMocks} from 'jest-fetch-mock';
import Context from './context';
import Loader from './loader';
import version from './version';
import {wait} from '../test/wait';

enableFetchMocks();

const context = new Context({
  user: {id: '123', email: 'test@example.com'},
  device: {mobile: true},
});
const apiKey = 'apiKey';
let loader: Loader;

describe('overriding endpoints', () => {
  it('has one default endpoint', () => {
    loader = new Loader({context, apiKey});

    expect(loader.endpoints).toStrictEqual([
      'https://api-prefab-cloud.global.ssl.fastly.net/api/v1',
      'https://api.prefab.cloud/api/v1',
    ]);
  });

  it('supports overriding the endpoints', () => {
    const endpoints = [
      'https://example.global.ssl.fastly.net/api/v1',
      'https://example.com/api/v1',
    ];

    loader = new Loader({context, apiKey, endpoints});

    expect(loader.endpoints).toStrictEqual([
      'https://example.global.ssl.fastly.net/api/v1',
      'https://example.com/api/v1',
    ]);
  });
});

describe('load', () => {
  describe('when the timeout is reached', () => {
    const TIMEOUT = 25;

    it('can successfully return from a second endpoint if the first times out', async () => {
      fetchMock.mockResponse(async (req) => {
        const url = new URL(req.url);

        if (url.pathname.startsWith('/too-long/')) {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                status: 200,
                body: JSON.stringify({values: {failover: {bool: false}}}),
              });
            }, TIMEOUT * 2);
          });
        }

        if (url.pathname.startsWith('/failover/')) {
          return {
            status: 200,
            body: JSON.stringify({values: {failover: {bool: true}}}),
          };
        }

        throw new Error(`Unexpected URL: ${url.toString()}`);
      });

      const endpoints = [`http://localhost/too-long`, `http://localhost/failover`];

      loader = new Loader({
        context,
        apiKey,
        timeout: TIMEOUT,
        endpoints,
      });

      const promise = loader.load();

      await wait(TIMEOUT);

      const results = (await promise) as {failover: {bool: boolean}};
      expect(results.failover.bool).toStrictEqual(true);
    });
  });

  describe('when the timeout is not reached', () => {
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

    it('can succesfully return results from the first endpoint', async () => {
      let fetchCount = 0;
      let requestUrl: URL | undefined;
      const requestHeaders = new Map();

      fetchMock.mockResponse(async (req) => {
        fetchCount += 1;

        requestUrl = new URL(req.url);

        requestHeaders.set('Authorization', req.headers.get('Authorization'));
        requestHeaders.set(
          'X-PrefabCloud-Client-Version',
          req.headers.get('X-PrefabCloud-Client-Version')
        );

        return {
          status: 200,
          body: JSON.stringify(data),
        };
      });

      loader = new Loader({context, apiKey});

      const results = await loader.load();
      expect(results).toStrictEqual(data.values);
      expect(fetchCount).toStrictEqual(1);

      if (!requestUrl || !requestHeaders) {
        throw new Error("Fetch hasn't happened");
      }

      expect(requestUrl.host).toEqual('api-prefab-cloud.global.ssl.fastly.net');

      expect(requestUrl.pathname).toStrictEqual(
        '/api/v1/configs/eval-with-context/eyJjb250ZXh0cyI6W3sidHlwZSI6InVzZXIiLCJ2YWx1ZXMiOnsiaWQiOnsic3RyaW5nIjoiMTIzIn0sImVtYWlsIjp7InN0cmluZyI6InRlc3RAZXhhbXBsZS5jb20ifX19LHsidHlwZSI6ImRldmljZSIsInZhbHVlcyI6eyJtb2JpbGUiOnsiYm9vbCI6dHJ1ZX19fV19'
      );

      expect(requestHeaders.get('Authorization')).toStrictEqual('Basic dTphcGlLZXk=');
      expect(requestHeaders.get('X-PrefabCloud-Client-Version')).toStrictEqual(
        `prefab-cloud-js-${version}`
      );
    });

    it('can successfully return from a second endpoint if the first fails', async () => {
      let fetchCount = 0;
      let requestUrl: URL | undefined;

      fetchMock.mockResponse(async (req) => {
        fetchCount += 1;

        if (fetchCount < 2) {
          return Promise.reject(new Error('Network error'));
        }

        requestUrl = new URL(req.url);

        return {
          status: 200,
          body: JSON.stringify(data),
        };
      });

      loader = new Loader({context, apiKey});

      const results = await loader.load();

      expect(fetchCount).toStrictEqual(2);
      expect(results).toStrictEqual(data.values);

      if (!requestUrl) {
        throw new Error("Last fetch hasn't happened");
      }
      expect(requestUrl.host).toStrictEqual('api.prefab.cloud');
    });

    it('fails when no endpoints are reachable', async () => {
      let fetchCount = 0;
      let requestUrl: URL | undefined;

      fetchMock.mockResponse(async (req) => {
        fetchCount += 1;
        requestUrl = new URL(req.url);
        return Promise.reject(new Error('Network error'));
      });

      loader = new Loader({context, apiKey});

      loader.load().catch((reason: any) => {
        expect(reason.message).toEqual('Network error');
        expect(fetchCount).toStrictEqual(2);

        if (!requestUrl) {
          throw new Error("Last fetch hasn't happened");
        }

        expect(requestUrl.host).toStrictEqual('api.prefab.cloud');
      });
    });
  });
});
