const base64Decode = (str: string) => {
  if (typeof window !== "undefined") {
    return window.atob(str);
  }

  return Buffer.from(str, "base64").toString("utf-8");
};

export default base64Decode;
