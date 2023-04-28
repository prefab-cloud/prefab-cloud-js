import Context from './context';
import base64Decode from '../test/base64Decode';

describe('constructor', () => {
  it('initializes with a hash', () => {
    const context = new Context({
      user: { firstName: 'Fred', lastName: 'Jones', id: 10001 },
      team: { name: 'Sales', isCostCenter: false },
    });

    expect(context.contexts).toStrictEqual({
      user: { firstName: 'Fred', lastName: 'Jones', id: 10001 },
      team: { name: 'Sales', isCostCenter: false },
    });
  });
});

describe('encode', () => {
  it('encodes the contexts as json then base64', () => {
    const context = new Context({
      user: { firstName: 'Fred', lastName: 'Jones', id: 10001 },
      team: { name: 'Sales', isCostCenter: false },
    });

    const encoded = context.encode();
    const decoded = JSON.parse(base64Decode(encoded));

    expect(decoded).toStrictEqual({
      contexts: [
        {
          type: 'user',
          values: {
            firstName: { string: 'Fred' },
            lastName: { string: 'Jones' },
            id: { int: 10001 },
          },
        },
        {
          type: 'team',
          values: {
            name: { string: 'Sales' },
            isCostCenter: { bool: false },
          },
        },
      ],
    });

    expect(encoded).toEqual(
      'eyJjb250ZXh0cyI6W3sidHlwZSI6InVzZXIiLCJ2YWx1ZXMiOnsiZmlyc3ROYW1lIjp7InN0cmluZyI6IkZyZWQifSwibGFzdE5hbWUiOnsic3RyaW5nIjoiSm9uZXMifSwiaWQiOnsiaW50IjoxMDAwMX19fSx7InR5cGUiOiJ0ZWFtIiwidmFsdWVzIjp7Im5hbWUiOnsic3RyaW5nIjoiU2FsZXMifSwiaXNDb3N0Q2VudGVyIjp7ImJvb2wiOmZhbHNlfX19XX0=',
    );
  });
});
