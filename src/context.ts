import Key from "./key";
import ContextValue from "./contextValue";
import base64Encode from "./base64Encode";

type Contexts = { [key: Key]: Record<string, ContextValue> };

const getType = (value: ContextValue) => {
  if (typeof value === "string") {
    return "string";
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return "int";
    }

    return "double";
  }

  return "bool";
};

export default class Context {
  contexts: Contexts;

  constructor(contexts: Contexts) {
    this.contexts = contexts;
  }

  encode() {
    const formatted = Object.keys(this.contexts).map((key) => {
      const values: Record<string, Record<string, ContextValue>> = {};

      Object.keys(this.contexts[key]).forEach((ckey) => {
        values[ckey] = {
          [getType(this.contexts[key][ckey])]: this.contexts[key][ckey],
        };
      });

      return {
        type: key,
        values,
      };
    });

    return encodeURIComponent(base64Encode(JSON.stringify({ contexts: formatted })));
  }
}
