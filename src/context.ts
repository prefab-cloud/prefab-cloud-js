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
    if (!Object.values(contexts).every((item: any) => typeof item === "object")) {
      // eslint-disable-next-line no-console
      console.error("Context must be an object where the value of each key is also an object");
    }

    if (
      Object.values(contexts).some((item: any) =>
        Object.values(item).some((value: any) => typeof value === "object" && value !== null)
      )
    ) {
      // we decided to allow null values, which requres an extra check since typeof null is object
      // eslint-disable-next-line no-console
      console.error("Nested objects are not supported in context values at this time");
    }

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
