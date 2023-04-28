import Key from './key';
import Context from './context';

export default class Identity {
  lookup: string;

  attributes: { [key: Key]: any };

  constructor(lookup: string, attributes: { [key: Key]: any }) {
    console.warn(
      'Identity is deprecated and will be removed in a future release. Please use Context instead.',
    );

    this.lookup = lookup;
    this.attributes = attributes;
  }

  toContext() {
    return new Context({
      '': this.attributes,
    });
  }
}
