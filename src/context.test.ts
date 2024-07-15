import Context from "./context";
import base64Decode from "../test/base64Decode";

describe("constructor", () => {
  it("initializes with a hash", () => {
    const context = new Context({
      user: { firstName: "Fred", lastName: "Jones", id: 10001 },
      team: { name: "Sales", isCostCenter: false },
    });

    expect(context.contexts).toStrictEqual({
      user: { firstName: "Fred", lastName: "Jones", id: 10001 },
      team: { name: "Sales", isCostCenter: false },
    });
  });

  it("validates the context object", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // does not error with valid context
    let context = new Context({ user: { device: "desktop" } });
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // errors without parent objects
    // @ts-expect-error - testing invalid data type
    context = new Context({ device: "desktop" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Context must be an array of objects");

    // errors with nested objects
    // @ts-expect-error - testing invalid data type
    // eslint-disable-next-line
    context = new Context({ user: { device: "desktop", nested: { name: "jeff" } } });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Nested objects are not supported in context values at this time"
    );

    consoleErrorSpy.mockRestore();
  });
});

describe("encode", () => {
  it("encodes the contexts as json then base64 then encodeURIComponent", () => {
    const context = new Context({
      user: { firstName: "Fred", lastName: "Jones", id: 10001 },
      team: { name: "Sales", isCostCenter: false },
    });

    const encoded = context.encode();

    const decoded = JSON.parse(base64Decode(decodeURIComponent(encoded)));

    expect(decoded).toStrictEqual({
      contexts: [
        {
          type: "user",
          values: {
            firstName: { string: "Fred" },
            lastName: { string: "Jones" },
            id: { int: 10001 },
          },
        },
        {
          type: "team",
          values: {
            name: { string: "Sales" },
            isCostCenter: { bool: false },
          },
        },
      ],
    });

    expect(decodeURIComponent(encoded)).toEqual(
      "eyJjb250ZXh0cyI6W3sidHlwZSI6InVzZXIiLCJ2YWx1ZXMiOnsiZmlyc3ROYW1lIjp7InN0cmluZyI6IkZyZWQifSwibGFzdE5hbWUiOnsic3RyaW5nIjoiSm9uZXMifSwiaWQiOnsiaW50IjoxMDAwMX19fSx7InR5cGUiOiJ0ZWFtIiwidmFsdWVzIjp7Im5hbWUiOnsic3RyaW5nIjoiU2FsZXMifSwiaXNDb3N0Q2VudGVyIjp7ImJvb2wiOmZhbHNlfX19XX0="
    );
  });
});
