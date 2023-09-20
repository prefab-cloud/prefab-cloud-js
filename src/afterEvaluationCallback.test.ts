// This is in its own file for jest concurrency isolation purposes

import {prefab, Context} from '../index';

const exampleContext = new Context({
  user: {firstName: 'Fred', lastName: 'Jones', id: 10001},
  team: {name: 'Sales', isCostCenter: false},
});

const waitForAsyncCall = async () => {
  await new Promise((r) => setTimeout(r, 1));
};

beforeEach(() => {
  prefab.context = undefined;
  prefab.loaded = false;
  prefab.configs = {};
});

afterEach(() => {
  prefab.context = undefined;
});

describe('afterEvaluationCallback', () => {
  test('get with no Context', async () => {
    const callback = jest.fn();

    prefab.afterEvaluationCallback = callback;

    prefab.setConfig({
      turbo: {
        double: 2.5,
      },
    });

    expect(callback).not.toHaveBeenCalled();

    prefab.get('turbo');

    expect(callback).not.toHaveBeenCalled();

    await waitForAsyncCall();

    expect(callback).toHaveBeenCalledWith('turbo', 2.5, undefined);
  });

  test('get with context', async () => {
    const callback = jest.fn();

    prefab.context = exampleContext;
    prefab.afterEvaluationCallback = callback;

    prefab.setConfig({
      turbo: {
        double: 2.5,
      },
    });

    expect(callback).not.toHaveBeenCalled();

    prefab.get('turbo');

    expect(callback).not.toHaveBeenCalled();

    await waitForAsyncCall();

    expect(callback).toHaveBeenCalledWith('turbo', 2.5, exampleContext);
  });

  test('isEnabled with no Context', async () => {
    const callback = jest.fn();

    prefab.afterEvaluationCallback = callback;

    // it is false when no config is loaded
    expect(prefab.isEnabled('foo')).toBe(false);

    await waitForAsyncCall();
    expect(callback).toHaveBeenCalledWith('foo', undefined, undefined);

    prefab.setConfig({
      foo: {
        bool: true,
      },
    });

    expect(prefab.isEnabled('foo')).toBe(true);

    await waitForAsyncCall();
    expect(callback).toHaveBeenCalledWith('foo', true, undefined);
  });

  test('isEnabled with Context', async () => {
    const callback = jest.fn();

    prefab.context = exampleContext;
    prefab.afterEvaluationCallback = callback;

    // it is false when no config is loaded
    expect(prefab.isEnabled('foo')).toBe(false);

    await waitForAsyncCall();
    expect(callback).toHaveBeenCalledWith('foo', undefined, exampleContext);

    prefab.setConfig({
      foo: {
        bool: true,
      },
    });

    expect(prefab.isEnabled('foo')).toBe(true);

    await waitForAsyncCall();
    expect(callback).toHaveBeenCalledWith('foo', true, exampleContext);
  });
});
