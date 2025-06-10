# prefab-cloud-js

A client for [Prefab]

## Installation

`npm install @prefab-cloud/prefab-cloud-js` or `yarn add @prefab-cloud/prefab-cloud-js`

If you'd prefer to use the standalone `<script>` tag approach, we recommend using
[jsDelivr][jsDelivr] for a minified/bundled version.

## Usage in your app

Initialize prefab with your api key and a `Context` for the current user/visitor/device/request:

```javascript
import { prefab, Context } from "@prefab-cloud/prefab-cloud-js";

const options = {
  apiKey: "1234",
  context: new Context({
    user: {
      email: "test@example.com",
    },
    device: { mobile: true },
  }),
};
await prefab.init(options);
```

<details>
<summary>Initialization with Context with the <code>&lt;script&gt; tag</code></summary>

```javascript
// `prefab` is available globally on the window object
// `Context` is available globally as `window.prefabNamespace.Context`
const options = {
  apiKey: "1234",
  context: new prefabNamespace.Context({
    user: {
      email: "test@example.com",
    },
    device: { mobile: true },
  }),
};

prefab.init(options).then(() => {
  console.log(options);
  console.log("test-flag is " + prefab.get("test-flag"));

  console.log("ex1-copywrite " + prefab.get("ex1-copywrite"));
  $(".copywrite").text(prefab.get("ex1-copywrite"));
});
```

</details>

Now you can use `prefab`'s config and feature flag evaluation, e.g.

```javascript
if (prefab.isEnabled('cool-feature') {
  // ...
}

setTimeout(ping, prefab.get('ping-delay'));
```

## Client API

| property        | example                               | purpose                                                                                      |
| --------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `isEnabled`     | `prefab.isEnabled("new-logo")`        | returns a boolean (default `false`) if a feature is enabled based on the current context     |
| `get`           | `prefab.get('retry-count')`           | returns the value of a flag or config evaluated in the current context                       |
| `getDuration`   | `prefab.getDuration('http.timeout')`  | returns a duration object `{seconds: number, ms: number}`                                    |
| `loaded`        | `if (prefab.loaded) { ... }`          | a boolean indicating whether prefab content has loaded                                       |
| `shouldLog`     | `if (prefab.shouldLog(...)) {`        | returns a boolean indicating whether the proposed log level is valid for the current context |
| `poll`          | `prefab.poll({frequencyInMs})`        | starts polling every `frequencyInMs` ms.                                                     |
| `stopPolling`   | `prefab.stopPolling()`                | stops the polling process                                                                    |
| `context`       | `prefab.context`                      | get the current context (after `init()`).                                                    |
| `updateContext` | `prefab.updateContext(newContext)`    | update the context and refetch. Pass `false` as a second argument to skip refetching         |
| `extract`       | `prefab.extract()`                    | returns the current config as a plain object of key, config value pairs                      |
| `hydrate`       | `prefab.hydrate(configurationObject)` | sets the current config based on a plain object of key, config value pairs                   |

## `shouldLog()`

`shouldLog` allows you to implement dynamic logging. It takes the following properties:

| property       | type   | example               | case-sensitive |
| -------------- | ------ | --------------------- | -------------- |
| `loggerName`   | string | my.corp.widgets.modal | Yes            |
| `desiredLevel` | string | INFO                  | No             |
| `defaultLevel` | string | ERROR                 | No             |

If you've configured a level value for `loggerName` (or a parent in the dot-notation hierarchy like
"my.corp.widgets") then that value will be used for comparison against the `desiredLevel`. If no
configured level is found in the hierarchy for `loggerName` then the provided `defaultLevel` will be
compared against `desiredLevel`.

If `desiredLevel` is greater than or equal to the comparison severity, then `shouldLog` returns
true. If the `desiredLevel` is less than the comparison severity, then `shouldLog` will return
false.

Example usage:

```javascript
const desiredLevel = "info";
const defaultLevel = "error";
const loggerName = "my.corp.widgets.modal";

if (shouldLog({ loggerName, desiredLevel, defaultLevel })) {
  console.info("...");
}
```

If no log level value is configured in Prefab for "my.corp.widgets.modal" or higher in the
hierarchy, then the `console.info` will not happen. If the value is configured and is INFO or more
verbose, the `console.info` will happen.

## `poll()`

After `prefab.init()`, you can start polling. Polling uses the context you defined in `init` by
default. You can update the context for future polling by setting it on the `prefab` object.

```javascript
// some time after init
prefab.poll({frequencyInMs: 300000})

// we're now polling with the context used from `init`

// later, perhaps after a visitor logs in and now you have the context of their current user
prefab.context = new Context({...prefab.context, user: { email: user.email, key: user.trackingId })

// future polling will use the new context
```

## Usage in your test suite

In your test suite, you probably want to skip the `prefab.init` altogether and instead use
`prefab.setConfig` to set up your test state.

```javascript
it("shows the turbo button when the feature is enabled", () => {
  prefab.setConfig({
    turbo: true,
    defaultMediaCount: 3,
  });

  const rendered = new MyComponent().render();

  expect(rendered).toMatch(/Enable Turbo/);
  expect(rendered).toMatch(/Media Count: 3/);
});
```

[Prefab]: https://www.prefab.cloud/
[jsDelivr]: https://www.jsdelivr.com/package/npm/@prefab-cloud/prefab-cloud-js

## Release Scripts

This package includes scripts to simplify the release process:

### Standard Release

To publish a new standard release (patch version):

```bash
./publish-release.sh
```

This script:

- Runs tests
- Builds the package
- Bumps the patch version
- Publishes to npm with the `latest` tag

### Pre-release

To publish a pre-release version:

- Manually bump the version in package.json (e.g. bump the patch version and add -pre1)
- `npm install` to update the lockfile

```bash
./publish-prerelease.sh
```

This script:

- Runs tests
- Builds the package
- Publishes to npm with the `pre` tag

To install the pre-release version:

```bash
npm install @prefab-cloud/prefab-cloud-js@pre
```
