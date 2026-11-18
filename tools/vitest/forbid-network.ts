import { afterEach } from 'vitest';

const IN_MEMORY = /^(data|blob):/;

const reachedNetwork: string[] = [];

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
}

function refuse(url: string): Error {
  reachedNetwork.push(url);
  return new TypeError(`Blocked unit test request to ${url}`);
}

const realFetch = globalThis.fetch;

globalThis.fetch = (input, init) => {
  const url = urlOf(input);
  if (IN_MEMORY.test(url)) return realFetch(input, init);
  return Promise.reject(refuse(url));
};

if (typeof XMLHttpRequest !== 'undefined') {
  XMLHttpRequest.prototype.open = function blockedOpen(_method: string, url: string | URL): void {
    throw refuse(String(url));
  };
}

afterEach(() => {
  if (reachedNetwork.length === 0) return;
  const urls = reachedNetwork.splice(0).join(', ');
  throw new Error(
    `A unit test reached the network (${urls}). Unit tests only run on mocked data: ` +
      'stub the service or mock fetch with vi.spyOn(globalThis, "fetch").'
  );
});
