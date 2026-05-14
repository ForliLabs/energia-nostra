export function getCsrfTokenFromDocument(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("csrf_token="));

  if (!cookie) {
    return null;
  }

  const [, rawToken = ""] = cookie.split("=");
  return decodeURIComponent(rawToken);
}

export function getMutationHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const csrfToken = getCsrfTokenFromDocument();
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}
