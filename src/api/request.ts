// The same deadline covers receiving headers and consuming the response body.
export function boundedFetch(input: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const deadline = AbortSignal.timeout(20_000);
  return fetch(input, { ...options, signal: options.signal ? AbortSignal.any([options.signal, deadline]) : deadline });
}
