export async function fetchJsonOrThrow<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let details = "";

    try {
      const body = await response.text();
      details = body ? `: ${body.slice(0, 200)}` : "";
    } catch {
      details = "";
    }

    throw new Error(`HTTP ${response.status}${details}`);
  }

  return response.json() as Promise<T>;
}