import Identity from './identity';
import Context from './context';

const lookup = 'test@example.com';

describe('constructor', () => {
  let warn: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockReset();
  });

  it('initializes with a lookup key and attributes', () => {
    const identity = new Identity(lookup, { foo: 'bar' });
    expect(identity.attributes).toEqual({ foo: 'bar' });
  });

  it('warns of deprecation', () => {
    new Identity(lookup, { foo: 'bar' });

    expect(warn).toHaveBeenCalledWith(
      'Identity is deprecated and will be removed in a future release. Please use Context instead.',
    );
  });
});

describe('toContext', () => {
  it('encodes the identity as json then base64', () => {
    const identity = new Identity(lookup, { foo: 'bar', baz: 'qux' });

    expect(identity.toContext()).toEqual(new Context({ '': { baz: 'qux', foo: 'bar' } }));
  });
});
