import Key from './key';
import base64Encode from './base64Encode';

export default class Identity {
  lookup: string;

  attributes: {[key: Key]: any};

  constructor(lookup: string, attributes: {[key: Key]: any}) {
    this.lookup = lookup;
    this.attributes = attributes;
  }

  encode() {
    const payload = { lookup: this.lookup, attributes: this.attributes || {} };

    return base64Encode(JSON.stringify(payload));
  }
}
