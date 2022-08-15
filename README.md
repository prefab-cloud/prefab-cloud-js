# prefab-cloud-js

A client for [Prefab]

## Installation

`npm install @prefab-cloud/prefab-cloud-js` or `yarn install @prefab-cloud/prefab-cloud-js`

## Usage in your app

Initialize prefab with your api key and an `Identity` for the current user/visitor:

```javascript
import prefab, { Identity } from '@prefab-cloud/prefab-cloud-js'

const options = { apiKey: '1234', identity: new Identity('user-1234', { device: 'desktop' }) };
await prefab.init(options);
```

Now you can use `prefab`'s config and feature flag evaluation, e.g.


```javascript
if (prefab.isEnabled('cool-feature') {
  // ...
}

setTimeout(ping, prefab.get('ping-delay'));
```

Here's an explanation of each property

| property    | example                        | purpose                                                                                            |
|-------------|--------------------------------|----------------------------------------------------------------------------------------------------|
| `isEnabled` | `prefab.isEnabled("new-logo")` | returns a boolean (default `false`) if a feature is enabled based on the currently identified user |
| `get`       | `prefab.get('retry-count')`    | returns the value of a flag or config evaluated in the context of the currently identified user    |
| `loaded`    | `if (prefab.loaded) { ... }`   | a boolean indicating whether prefab content has loaded                                             |

## Usage in your test suite

In your test suite, you probably want to skip the `prefab.init` altogether and instead use `prefab.setConfig` to setup your test state.

```javascript
it('shows the turbo button when the feature is enabled', () => {
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
