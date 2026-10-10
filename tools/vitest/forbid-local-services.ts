const STUDIO_SERVICES = /^https?:\/\/(localhost|127\.0\.0\.1):(4500|4502)(\/|$)/;

const realFetch = globalThis.fetch;
const reachedServices: string[] = [];

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
}

globalThis.fetch = (input, init) => {
  const url = urlOf(input);
  if (!STUDIO_SERVICES.test(url)) return realFetch(input, init);
  reachedServices.push(url);
  return Promise.reject(new TypeError(`Blocked unit test request to ${url}`));
};

afterEach(() => {
  if (reachedServices.length === 0) return;
  const urls = reachedServices.splice(0).join(', ');
  throw new Error(
    `A unit test reached the local studio services (${urls}). Provide a stub for ` +
      'CreationProgressService or mock fetch, so tests never spend creator credits.'
  );
});
