import Key from './key';
import Context from './context';

export default class Identity {
  attributes: {[key: Key]: any};

  constructor(_lookup: string, attributes: {[key: Key]: any}) {
    // eslint-disable-next-line no-console
    console.warn(
      'Identity is deprecated and will be removed in a future release. Please use Context instead.'
    );

    this.attributes = attributes;
  }

  toContext() {
    return new Context({
      '': this.attributes,
    });
  }
}
