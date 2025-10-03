import { HEADERTHISCONTENTTYPE, SERVERNAME } from "../constants/server";
import { getCookie, setCookie, deleteCookie } from "./cookie";

class Api {
  constructor(options) {
    this._baseUrl = options.baseUrl;
    this._headers = {
      ...(HEADERTHISCONTENTTYPE || { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    };
  }

  async _request(path, options = {}) {
    let refreshPromise = null;
    const url = `${this._baseUrl}${path}`;
    let headers = { ...this._headers, ...(options.headers || {}) };

    const token = getCookie("accessToken");
    if (token) headers.Authorization = `Bearer ${token}`;

    let res = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // ← чтобы httpOnly refreshToken кука уезжала
    });

    if (res.status === 401) {
      if (!refreshPromise)
        refreshPromise = this.refreshToken().finally(
          () => (refreshPromise = null)
        );
      const refreshed = await refreshPromise; // ждём один общий рефреш
      if (refreshed?.access_token) {
        headers.Authorization = `Bearer ${refreshed.access_token}`;
        return fetch(url, { ...options, headers, credentials: "include" });
      }
      throw new Error("Не удалось обновить токен");
    }

    if (!res.ok) {
      let err;
      try {
        err = await res.json();
      } catch {
        err = { message: `HTTP ${res.status}` };
      }
      const e = new Error(err.message || `HTTP ${res.status}`);
      console.debug("HTTP", options.method || "GET", url, options.body);
      e.status = res.status;
      e.payload = err;
      throw e;
    }

    if (res.status === 204) return null;
    return res.json();
  }

  // POST /signin -> { access_token, user } ; refreshToken приходит httpOnly-кукой
  async login({ username, password }) {
    const data = await this._request(`/signin`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    // сохраняем только access
    if (data?.access_token) {
      setCookie("accessToken", data.access_token, {
        expires: 15 * 60,
        path: "/",
      });
    }

    return data;
  }

  // POST /refresh-token -> { access_token }
  async refreshToken() {
    const res = await fetch(`${this._baseUrl}/refresh-token`, {
      method: "POST",
      credentials: "include", // ← сервер сам прочитает httpOnly куку
      cache: "no-store", // ← чтобы не кэшировался ответ с токеном
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      // попробуем вытащить сообщение
      let message = "";
      try {
        message = JSON.parse(text)?.message || "";
      } catch {}
      // eslint-disable-next-line no-throw-literal
      throw {
        status: res.status,
        message: message || `Refresh failed (${res.status})`,
      };
    }

    // безопасный парсинг json
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    return data; // { access_token?: string, ... }
  }

  async getMe() {
    return this._request(`/me`, { method: "GET" });
  }

  async logout() {
    deleteCookie("accessToken");
    return true;
  }
}

export const api = new Api({ baseUrl: SERVERNAME });
