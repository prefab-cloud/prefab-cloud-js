import { Config, EvaluationPayload } from "./config";

describe("digest", () => {
  it("works when given untyped raw key/value pairs", () => {
    const payload = {
      "stringList.example": ["one", "two", "three"],
      "string.example": "Config Heading",
      "bool.example": true,
      "int.example": 42,
      "double.example": 3.14,
      "duration.example": { seconds: 1884, ms: 1884000 },
      "json.example": { foo: "bar" },
    };

    const configs = Config.digest(payload);

    expect(configs["stringList.example"].value).toStrictEqual(["one", "two", "three"]);
    expect(configs["string.example"].value).toStrictEqual("Config Heading");
    expect(configs["bool.example"].value).toStrictEqual(true);
    expect(configs["int.example"].value).toStrictEqual(42);
    expect(configs["double.example"].value).toStrictEqual(3.14);
    expect(configs["duration.example"].value).toStrictEqual({ seconds: 1884, ms: 1884000 });
    expect(configs["json.example"].value).toStrictEqual({ foo: "bar" });
  });

  it("works when given a v2 evaluation payload", () => {
    const payload: EvaluationPayload = {
      evaluations: {
        "stringList.example": {
          value: { stringList: ["one", "two", "three"] },
          configEvaluationMetadata: {
            configRowIndex: "0",
            conditionalValueIndex: "0",
            type: "CONFIG",
            id: "17122374206304372",
            valueType: "STRING_LIST",
          },
        },
        "string.example": {
          value: { string: "Config Heading" },
          configEvaluationMetadata: {
            configRowIndex: "0",
            conditionalValueIndex: "0",
            type: "CONFIG",
            id: "17062052188547913",
            valueType: "STRING",
          },
        },
        "bool.example": {
          value: { bool: true },
          configEvaluationMetadata: {
            configRowIndex: "0",
            conditionalValueIndex: "0",
            type: "FEATURE_FLAG",
            id: "17199257245884908",
            valueType: "BOOL",
          },
        },
        "int.example": {
          value: { int: 42 },
          configEvaluationMetadata: {
            configRowIndex: "0",
            conditionalValueIndex: "0",
            type: "CONFIG",
            id: "17199257245884908",
            valueType: "INT",
          },
        },
        "double.example": {
          value: { double: 3.14 },
          configEvaluationMetadata: {
            configRowIndex: "0",
            conditionalValueIndex: "0",
            type: "CONFIG",
            id: "17199257245884908",
            valueType: "DOUBLE",
          },
        },
        "duration.example": {
          value: {
            duration: { definition: "PT1884S", millis: 1884000 },
          },
          configEvaluationMetadata: {
            configRowIndex: "0",
            conditionalValueIndex: "0",
            type: "CONFIG",
            id: "17171570773810353",
            valueType: "DURATION",
          },
        },
        "json.example": {
          value: { json: '{ "foo": "bar" }' },
          configEvaluationMetadata: {
            configRowIndex: "0",
            conditionalValueIndex: "0",
            type: "CONFIG",
            id: "17199257245884908",
            valueType: "JSON",
          },
        },
      },
      apikeyMetadata: { id: "103" },
    };

    const configs = Config.digest(payload);

    expect(configs["stringList.example"].value).toStrictEqual(["one", "two", "three"]);
    expect(configs["string.example"].value).toStrictEqual("Config Heading");
    expect(configs["bool.example"].value).toStrictEqual(true);
    expect(configs["int.example"].value).toStrictEqual(42);
    expect(configs["double.example"].value).toStrictEqual(3.14);
    expect(configs["duration.example"].value).toStrictEqual({
      seconds: 1884,
      ms: 1884000,
    });
    expect(configs["json.example"].value).toStrictEqual({ foo: "bar" });
  });
});
