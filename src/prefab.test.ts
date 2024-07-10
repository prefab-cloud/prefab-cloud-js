import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { Prefab, Config, Context } from "../index";
import { DEFAULT_TIMEOUT } from "./apiHelpers";
import { wait } from "../test/wait";
import version from "./version";

enableFetchMocks();

let prefab = new Prefab();

type InitParams = Parameters<typeof prefab.init>[0];

const defaultTestInitParams: InitParams = {
  apiKey: "1234",
  context: new Context({ user: { device: "desktop" } }),
  collectEvaluationSummaries: false,
};

beforeEach(() => {
  prefab = new Prefab();
});

afterEach(() => {
  prefab.stopPolling();
  prefab.stopTelemetry();
});

describe("init", () => {
  it("works when the request is successful", async () => {
    const data = { values: { turbo: { double: 2.5 } } };
    fetchMock.mockResponse(JSON.stringify(data));

    expect(prefab.loaded).toBe(false);

    await prefab.init(defaultTestInitParams);

    expect(prefab.configs).toEqual({
      turbo: new Config("turbo", 2.5, "double"),
    });
    expect(prefab.loaded).toBe(true);
  });

  it("returns falsy responses for flag checks if it cannot load config", async () => {
    fetchMock.mockReject(new Error("Network error"));

    expect(prefab.loaded).toBe(false);

    prefab.init(defaultTestInitParams).catch((reason: any) => {
      expect(reason.message).toEqual("Network error");
      expect(prefab.configs).toEqual({});

      expect(prefab.isEnabled("foo")).toBe(false);
    });

    expect(prefab.loaded).toBe(false);
  });

  it("allows passing a timeout down to the loader", async () => {
    const data = { values: { turbo: { double: 2.5 } } };
    fetchMock.mockResponse(JSON.stringify(data));

    const config: InitParams = { ...defaultTestInitParams };
    expect(prefab.loaded).toBe(false);

    await prefab.init(config);
    expect(prefab.loader?.timeout).toEqual(DEFAULT_TIMEOUT);

    const NEW_TIMEOUT = 123;
    config.timeout = NEW_TIMEOUT;

    await prefab.init(config);
    expect(prefab.loader?.timeout).toEqual(NEW_TIMEOUT);
  });

  it("sends the client version", async () => {
    let headersAsserted = false;

    fetchMock.mockResponse(async (req) => {
      expect(req.headers.get("X-PrefabCloud-Client-Version")).toStrictEqual(
        `prefab-cloud-js-${version}`
      );
      headersAsserted = true;

      return {
        status: 200,
        body: "{}",
      };
    });

    expect(prefab.loaded).toBe(false);

    await prefab.init(defaultTestInitParams);
    expect(headersAsserted).toBe(true);
  });

  it("allows opting out of eval summary telemetry", async () => {
    const params: InitParams = {
      apiKey: "1234",
      context: new Context({ user: { device: "desktop" } }),
    };

    await prefab.init(params);
    expect(prefab.isCollectingEvaluationSummaries()).toBe(true);

    params.collectEvaluationSummaries = false;

    await prefab.init(params);
    expect(prefab.isCollectingEvaluationSummaries()).toBe(false);
  });

  it("can override the client name and version", async () => {
    const nameOverride = "prefab-cloud-react";
    const versionOverride = "0.11.9";
    let headersAsserted = false;

    fetchMock.mockResponse(async (req) => {
      expect(req.headers.get("X-PrefabCloud-Client-Version")).toStrictEqual(
        `${nameOverride}-${versionOverride}`
      );
      headersAsserted = true;

      return {
        status: 200,
        body: "{}",
      };
    });

    const params: InitParams = {
      ...defaultTestInitParams,
      clientNameString: nameOverride,
      clientVersionString: versionOverride,
    };
    expect(prefab.loaded).toBe(false);

    await prefab.init(params);
    expect(headersAsserted).toBe(true);
  });
});

describe("poll", () => {
  it("takes a frequencyInMs and updates on that interval", async () => {
    const data = { values: {} };
    const frequencyInMs = 25;
    fetchMock.mockResponse(JSON.stringify(data));

    await prefab.init(defaultTestInitParams);

    if (!prefab.loader) {
      throw new Error("Expected loader to be set");
    }

    await prefab.poll({ frequencyInMs });
    expect(prefab.loader.context).toStrictEqual(prefab.context);

    if (prefab.pollStatus.status !== "running") {
      throw new Error("Expected pollStatus to be running");
    }
    expect(prefab.pollCount).toEqual(0);
    expect(prefab.loader.context).toStrictEqual(prefab.context);

    await wait(frequencyInMs);
    expect(prefab.pollCount).toEqual(1);
    expect(prefab.loader.context).toStrictEqual(prefab.context);

    // changing the context should set the context for the loader as well
    const newContext = new Context({ abc: { def: "ghi" } });
    prefab.updateContext(newContext, true);

    await wait(frequencyInMs);
    expect(prefab.pollCount).toEqual(2);
    expect(prefab.loader.context).toStrictEqual(newContext);

    prefab.stopPolling();

    // Polling does not continue after stopPolling is called
    await wait(frequencyInMs * 2);
    expect(prefab.pollCount).toEqual(2);
  });

  it("is reset when you call poll() again", async () => {
    jest.spyOn(globalThis, "clearTimeout");

    const data = { values: {} };
    const frequencyInMs = 25;
    fetchMock.mockResponse(JSON.stringify(data));

    await prefab.init(defaultTestInitParams);

    if (!prefab.loader) {
      throw new Error("Expected loader to be set");
    }

    await prefab.poll({ frequencyInMs });
    expect(prefab.loader.context).toStrictEqual(prefab.context);

    if (prefab.pollStatus.status !== "running") {
      throw new Error("Expected pollStatus to be running");
    }
    expect(prefab.pollCount).toEqual(0);
    expect(prefab.loader.context).toStrictEqual(prefab.context);

    const timeoutId = prefab.pollTimeoutId;

    prefab.poll({ frequencyInMs });
    expect(clearTimeout).toHaveBeenCalledWith(timeoutId);
    expect(prefab.pollTimeoutId).toBeUndefined();
  });
});

describe("setConfig", () => {
  it("works when types are provided", () => {
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
      turbo: new Config("turbo", 2.5, "double"),
      foo: new Config("foo", true, "bool"),
    });

    expect(prefab.isEnabled("foo")).toBe(true);
    expect(prefab.get("turbo")).toEqual(2.5);
  });

  it("works when types are not provided", () => {
    expect(prefab.configs).toEqual({});

    prefab.setConfig({
      turbo: 2.5,

      foo: true,
    });

    expect(prefab.configs).toEqual({
      turbo: new Config("turbo", 2.5, "unknown"),
      foo: new Config("foo", true, "unknown"),
    });

    expect(prefab.isEnabled("foo")).toBe(true);
    expect(prefab.get("turbo")).toEqual(2.5);
  });
});

test("get", () => {
  prefab.setConfig({
    turbo: { double: 2.5 },
    durationExample: {
      duration: {
        seconds: "1884",
        definition: "PT31.4M",
      },
    },
    jsonExample: {
      json: { json: `{ "foo": "bar", "baz": 123 }` },
    },
  });

  expect(prefab.get("turbo")).toEqual(2.5);

  expect(prefab.get("jsonExample")).toStrictEqual({ foo: "bar", baz: 123 });

  // You _can_ use `get` for durations but you probably want `getDuration` to save yourself some `as` casting
  expect(prefab.get("durationExample")).toStrictEqual({ ms: 1884 * 1000, seconds: 1884 });
  // e.g.
  // expect((prefab.get("durationExample") as Duration).seconds).toEqual(1884);
  // expect((prefab.get("durationExample") as Duration).ms).toEqual(1884 * 1000);
});

test("getDuration", () => {
  prefab.setConfig({
    turbo: { double: 2.5 },
    durationExample: {
      duration: {
        seconds: "1884",
        definition: "PT31.4M",
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(prefab.getDuration("durationExample")!.seconds).toEqual(1884);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(prefab.getDuration("durationExample")!.ms).toEqual(1884 * 1000);

  expect(() => {
    prefab.getDuration("turbo");
  }).toThrowError('Value for key "turbo" is not a duration');
});

test("isEnabled", () => {
  // it is false when no config is loaded
  expect(prefab.isEnabled("foo")).toBe(false);

  prefab.setConfig({
    foo: {
      bool: true,
    },
  });

  expect(prefab.isEnabled("foo")).toBe(true);
});

describe("shouldLog", () => {
  test("compares against the default level where there is no value", () => {
    expect(
      prefab.shouldLog({
        loggerName: "example",
        desiredLevel: "INFO",
        defaultLevel: "INFO",
      })
    ).toBe(true);

    expect(
      prefab.shouldLog({
        loggerName: "example",
        desiredLevel: "DEBUG",
        defaultLevel: "INFO",
      })
    ).toBe(false);
  });

  test("compares against the value when present", () => {
    prefab.setConfig({
      "log-level.example": {
        logLevel: "INFO",
      },
    });

    expect(
      prefab.shouldLog({
        loggerName: "example",
        desiredLevel: "INFO",
        defaultLevel: "ERROR",
      })
    ).toBe(true);

    expect(
      prefab.shouldLog({
        loggerName: "example",
        desiredLevel: "DEBUG",
        defaultLevel: "ERROR",
      })
    ).toBe(false);
  });

  test("traverses the hierarchy to get the closest level for the loggerName", () => {
    const loggerName = "some.test.name.with.more.levels";

    prefab.setConfig({
      "log-level.some.test.name": {
        logLevel: "TRACE",
      },
      "log-level.some.test": {
        logLevel: "DEBUG",
      },
      "log-level.irrelevant": {
        logLevel: "ERROR",
      },
    });

    expect(
      prefab.shouldLog({
        loggerName,
        desiredLevel: "TRACE",
        defaultLevel: "ERROR",
      })
    ).toEqual(true);

    expect(
      prefab.shouldLog({
        loggerName: "some.test",
        desiredLevel: "TRACE",
        defaultLevel: "ERROR",
      })
    ).toEqual(false);

    expect(
      prefab.shouldLog({
        loggerName: "some.test",
        desiredLevel: "DEBUG",
        defaultLevel: "ERROR",
      })
    ).toEqual(true);

    expect(
      prefab.shouldLog({
        loggerName: "some.test",
        desiredLevel: "INFO",
        defaultLevel: "ERROR",
      })
    ).toEqual(true);
  });

  it("can use the root log level setting if nothing is found in the hierarchy", () => {
    prefab.setConfig({
      "log-level": {
        logLevel: "INFO",
      },
    });

    expect(
      prefab.shouldLog({
        loggerName: "some.test",
        desiredLevel: "INFO",
        defaultLevel: "ERROR",
      })
    ).toEqual(true);

    expect(
      prefab.shouldLog({
        loggerName: "some.test",
        desiredLevel: "DEBUG",
        defaultLevel: "ERROR",
      })
    ).toEqual(false);
  });
});

describe("updateContext", () => {
  it("updates the context and reloads", async () => {
    let invokedUrl: string | undefined;

    fetchMock.mockResponse(async (req) => {
      invokedUrl = req.url;

      return {
        status: 200,
        body: "{}",
      };
    });

    const initialContext = new Context({ user: { device: "desktop" } });

    await prefab.init(defaultTestInitParams);

    if (!prefab.loader) {
      throw new Error("Expected loader to be set");
    }

    expect(prefab.loader.context).toStrictEqual(initialContext);
    expect(prefab.context).toStrictEqual(initialContext);

    if (invokedUrl === undefined) {
      throw new Error("Expected invokedUrl to be set");
    }

    expect(invokedUrl).toStrictEqual(
      `https://api-prefab-cloud.global.ssl.fastly.net/api/v1/configs/eval-with-context/${initialContext.encode()}?collectContextMode=PERIODIC_EXAMPLE`
    );

    const newContext = new Context({ user: { device: "mobile" } });

    await prefab.updateContext(newContext);

    expect(prefab.loader.context).toStrictEqual(newContext);
    expect(prefab.context).toStrictEqual(newContext);

    expect(invokedUrl).toStrictEqual(
      `https://api-prefab-cloud.global.ssl.fastly.net/api/v1/configs/eval-with-context/${newContext.encode()}?collectContextMode=PERIODIC_EXAMPLE`
    );
  });
});
