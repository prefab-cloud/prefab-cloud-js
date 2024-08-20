const base64Encode = (obj: string) => {
  if (typeof window !== "undefined") {
    if (typeof TextEncoder === "undefined") {
      return window.btoa(obj);
    }

    const bytes = new TextEncoder().encode(obj);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
    return btoa(binString);
  }

  return Buffer.from(obj).toString("base64");
};

export default base64Encode;
