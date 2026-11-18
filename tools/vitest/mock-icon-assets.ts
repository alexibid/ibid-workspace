const ICON_ASSET = /(^|\/)icons\/[\w-]+\.svg$/;

const BLANK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>';

const guardedFetch = globalThis.fetch;

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
}

globalThis.fetch = (input, init) => {
  if (!ICON_ASSET.test(urlOf(input))) return guardedFetch(input, init);
  return Promise.resolve(
    new Response(BLANK_ICON, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } })
  );
};
