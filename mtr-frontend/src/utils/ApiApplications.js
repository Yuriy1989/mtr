import { HEADERTHISCONTENTTYPE, SERVERNAME } from "../constants/server";
import { getCookie } from "./cookie";

// helper для запросов с токеном и авто-JSON
async function request(path, options = {}) {
  const headers = {
    ...(HEADERTHISCONTENTTYPE || { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  const token = getCookie("accessToken");
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${SERVERNAME}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { message: text };
        }
      })()
    : null;

  if (!res.ok) {
    const e = new Error(data?.message || `HTTP ${res.status}`);
    e.status = res.status;
    e.payload = data;
    throw e;
  }
  return data;
}

class Api {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  // --- Приложение №3 ---
  saveAppendix3(payload) {
    return request(`/table-applications/upsert`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  getAppendix3ByZapiska(zapiskaId) {
    return request(`/table-applications/by-zapiska/${zapiskaId}`, {
      method: "GET",
    });
  }

  patchAppendix3Row(id, patch) {
    return request(`/table-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  }

  updateApplication(id, dto) {
    return request(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  }

  // NEW: история изменений строки Приложения №3
  getApp3RowHistory(rowId) {
    return request(`/table-applications/${rowId}/history`, {
      method: "GET",
    }).then((r) => r?.data ?? []);
  }

  // NEW: можно передать { start, end } (ISO строки)
  getApplications(params = {}) {
    const qs = new URLSearchParams();
    if (params.start) qs.set("start", params.start);
    if (params.end) qs.set("end", params.end);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/applications/all${suffix}`, { method: "GET" }).then(
      (res) => res?.data ?? []
    );
  }

  getApplicationById(id) {
    return request(`/applications/${id}`, { method: "GET" }).then(
      (r) => r?.data
    );
  }

  deleteApp3(id) {
    return request(`/applications/${id}`, { method: "DELETE" });
  }
}

export const api = new Api({ baseUrl: SERVERNAME });
