export default class FetchMock {
  requestCount = 0;

  fetchedUrl: URL | undefined;

  static mock = (logic: Function) => new FetchMock(logic);

  constructor(logic : Function) {
    global.fetch = jest.fn((url) => {
      this.requestCount += 1;
      this.fetchedUrl = new URL(url.toString());

      return logic({ url, requestCount: this.requestCount });
    });
  }
}
