const base64Encode = (obj: string) => {
  if (typeof window !== 'undefined') {
    return window.btoa(obj);
  }

  return Buffer.from(obj).toString('base64');
};

export default base64Encode;
