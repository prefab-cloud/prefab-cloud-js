// This is in its own file for jest concurrency isolation purposes

import { Prefab, Context } from "../index";

const exampleContext = new Context({
  user: { firstName: "Fred", lastName: "Jones", id: 10001 },
  team: { name: "Sales", isCostCenter: false },
});

const setContext = async (prefab: Prefab, contexts: Context) => {
  // eslint-disable-next-line no-param-reassign
  prefab.loader = {} as unknown as Prefab["loader"];
  await prefab.updateContext(contexts, true);
};

const waitForAsyncCall = async () => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((r) => setTimeout(r, 1));
};

describe("afterEvaluationCallback", () => {
  test("get with no Context", async () => {
    const callback = jest.fn();

    const prefab = new Prefab();
    prefab.afterEvaluationCallback = callback;

    prefab.hydrate({ turbo: 2.5 });

    expect(callback).not.toHaveBeenCalled();

    prefab.get("turbo");

    expect(callback).not.toHaveBeenCalled();

    await waitForAsyncCall();

    expect(callback).toHaveBeenCalledWith("turbo", 2.5, { contexts: {} });
  });

  test("get with context", async () => {
    const callback = jest.fn();

    const prefab = new Prefab();
    setContext(prefab, exampleContext);

    prefab.afterEvaluationCallback = callback;

    prefab.hydrate({ turbo: 2.5 });

    expect(callback).not.toHaveBeenCalled();

    prefab.get("turbo");

    expect(callback).not.toHaveBeenCalled();

    await waitForAsyncCall();

    expect(callback).toHaveBeenCalledWith("turbo", 2.5, exampleContext);
  });

  test("isEnabled with no Context", async () => {
    const callback = jest.fn();

    const prefab = new Prefab();
    prefab.afterEvaluationCallback = callback;

    // it is false when no config is loaded
    expect(prefab.isEnabled("foo")).toBe(false);

    // callback should not be called when no config is loaded
    await waitForAsyncCall();
    expect(callback).toHaveBeenCalledTimes(0);

    prefab.hydrate({ foo: true });

    expect(prefab.isEnabled("foo")).toBe(true);

    await waitForAsyncCall();
    expect(callback).toHaveBeenCalledWith("foo", true, { contexts: {} });
  });

  test("isEnabled with Context", async () => {
    const callback = jest.fn();
    const prefab = new Prefab();

    await setContext(prefab, exampleContext);
    prefab.afterEvaluationCallback = callback;

    // it is false when no config is loaded
    expect(prefab.isEnabled("foo")).toBe(false);

    // callback should not be called when no config is loaded
    await waitForAsyncCall();
    expect(callback).toHaveBeenCalledTimes(0);

    prefab.hydrate({ foo: true });

    expect(prefab.isEnabled("foo")).toBe(true);

    await waitForAsyncCall();
    expect(callback).toHaveBeenCalledWith("foo", true, exampleContext);
  });
});
