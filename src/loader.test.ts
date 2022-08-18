/* eslint-disable-next-line import/no-extraneous-dependencies */
import express from 'express';
import Identity from './identity';
import Loader from './loader';
import version from './version';

import FetchMock from '../test/fetchMock';

const identity = new Identity('test@example.com', { foo: 'bar' });
const apiKey = 'apiKey';
let loader : Loader;

describe('overriding endpoints', () => {
  it('has one default endpoint', () => {
    loader = new Loader({ identity, apiKey });

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

    loader = new Loader({ identity, apiKey, endpoints });

    expect(loader.endpoints).toStrictEqual([
      'https://example.global.ssl.fastly.net/api/v1',
      'https://example.com/api/v1',
    ]);
  });
});

describe('load', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runAllTimers();
  });

  describe('when the timeout is reached', () => {
    let server : any;

    const TIMEOUT = 500;
    const PORT = 8675;

    beforeEach(() => {
      const app = express();

      app.get('/too-long/configs/eval/*/*', (_, res:any) => {
        setTimeout(() => {
          res.send('{ "values": { "failover": { "bool": false } } }');
        }, TIMEOUT + 1000);
      });

      app.get('/failover/configs/eval/*/*', (_, res:any) => {
        res.send('{ "values": { "failover": { "bool": true } } }');
      });

      app.get('/heartbeat', (_, res:any) => {
        res.send('OK');
      });

      server = app.listen(PORT, () => {});
    });

    afterEach((done) => {
      server.close(done);
    });

    it('can successfully return from a second endpoint if the first times out', async () => {
      const endpoints = [
        `http://localhost:${PORT}/too-long`,
        `http://localhost:${PORT}/failover`,
      ];

      loader = new Loader({
        identity, apiKey, timeout: TIMEOUT, endpoints,
      });

      const promise = loader.load();

      // let time pass
      jest.runAllTimers();

      const results = await promise as {[key: string]: any};
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
      const fetchMock = new FetchMock(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
      }));

      loader = new Loader({ identity, apiKey });

      const results = await loader.load();

      expect(fetchMock.requestCount).toStrictEqual(1);
      expect(results).toStrictEqual(data.values);
      expect(fetchMock.lastUrl?.host).toStrictEqual('api-prefab-cloud.global.ssl.fastly.net');
      expect(fetchMock.lastRequestOptions?.headers).toStrictEqual({
        Authorization: 'Basic dTphcGlLZXk=',
        'X-PrefabCloud-Client-Version': `prefab-cloud-js${version}`,
      });
    });

    it('can successfully return from a second endpoint if the first fails', async () => {
      const fetchMock = new FetchMock(({ requestCount } : {requestCount: number}) => {
        if (requestCount < 2) {
          return Promise.reject(new Error('Network error'));
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        });
      });

      loader = new Loader({ identity, apiKey });

      const results = await loader.load();

      expect(fetchMock.requestCount).toStrictEqual(2);
      expect(results).toStrictEqual(data.values);
      expect(fetchMock.lastUrl?.host).toStrictEqual('api.prefab.cloud');
    });

    it('fails when no endpoints are reachable', async () => {
      const fetchMock = new FetchMock(() => Promise.reject(new Error('Network error')));

      loader = new Loader({ identity, apiKey });

      loader.load().catch((reason: any) => {
        expect(reason.message).toEqual('Network error');
        expect(fetchMock.requestCount).toStrictEqual(2);
        expect(fetchMock.lastUrl?.host).toStrictEqual('api.prefab.cloud');
      });
    });
  });
});
