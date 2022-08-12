import Identity from './identity';

const lookup = 'test@example.com';

describe('constructor', () => {
  it('initializes with a lookup key and attributes', () => {
    const identity = new Identity(lookup, { foo: 'bar' });
    expect(identity.lookup).toEqual(lookup);
    expect(identity.attributes).toEqual({ foo: 'bar' });
  });
});

describe('encode', () => {
  it('encodes the identity as json then base64', () => {
    const identity = new Identity(lookup, { foo: 'bar' });

    expect(identity.encode()).toEqual('eyJsb29rdXAiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiYXR0cmlidXRlcyI6eyJmb28iOiJiYXIifX0=');
  });
});
