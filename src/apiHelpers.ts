import base64Encode from "./base64Encode";
import version from "./version";

export const headers = (apiKey: string) => ({
  Authorization: `Basic ${base64Encode(`u:${apiKey}`)}`,
  "X-PrefabCloud-Client-Version": `prefab-cloud-js-${version}`,
});

export const DEFAULT_TIMEOUT = 10000;
