import { ProxyAgent, fetch as undiciFetch } from "undici";
import { wrapFetchWithAbortSignal } from "../infra/fetch.js";

const TELEGRAM_PROXY_ENV_KEYS = [
  "OPENCLAW_TELEGRAM_PROXY",
  "TELEGRAM_PROXY",
  "HTTPS_PROXY",
  "https_proxy",
  "HTTP_PROXY",
  "http_proxy",
  "ALL_PROXY",
  "all_proxy",
];

export function resolveTelegramProxyUrl(explicit?: string): string | undefined {
  const trimmed = explicit?.trim();
  if (trimmed) {
    return trimmed;
  }
  for (const key of TELEGRAM_PROXY_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function makeProxyFetch(proxyUrl: string): typeof fetch {
  const agent = new ProxyAgent(proxyUrl);
  // undici's fetch is runtime-compatible with global fetch but the types diverge
  // on stream/body internals. Single cast at the boundary keeps the rest type-safe.
  const fetcher = ((input: RequestInfo | URL, init?: RequestInit) =>
    undiciFetch(input as string | URL, {
      ...(init as Record<string, unknown>),
      dispatcher: agent,
    }) as unknown as Promise<Response>) as typeof fetch;
  return wrapFetchWithAbortSignal(fetcher);
}
