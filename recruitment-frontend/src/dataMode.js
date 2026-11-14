const MODE_KEY = "recruitment-data-mode";
const TOKEN_KEY = "recruitment-api-token";

export function getDataMode() {
  return localStorage.getItem(MODE_KEY) || "demo";
}

export function setDataMode(mode) {
  localStorage.setItem(MODE_KEY, mode);
}

export function getApiToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setApiToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function hasApiToken() {
  return Boolean(getApiToken());
}
