const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLocalhost(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return LOCAL_HOSTNAMES.has(window.location.hostname);
}
