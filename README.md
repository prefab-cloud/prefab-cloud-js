# prefab-cloud-js

A client for [Prefab]

## Installation

`npm install @prefab-cloud/prefab-cloud-js` or `yarn add @prefab-cloud/prefab-cloud-js`

## Usage in your app

Initialize prefab with your api key and a `Context` for the current user/visitor/device/request:

```javascript
import { prefab, Context } from '@prefab-cloud/prefab-cloud-js'

const options = { apiKey: '1234', context: new Context({user: { email: 'test@example.com' }, device: { mobile: true } }) };
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
| `isEnabled` | `prefab.isEnabled("new-logo")` | returns a boolean (default `false`) if a feature is enabled based on the current context |
| `get`       | `prefab.get('retry-count')`    | returns the value of a flag or config evaluated in the current context |
| `loaded`    | `if (prefab.loaded) { ... }`   | a boolean indicating whether prefab content has loaded                                             |

## Usage in your test suite

In your test suite, you probably want to skip the `prefab.init` altogether and instead use `prefab.setConfig` to set up your test state.

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
