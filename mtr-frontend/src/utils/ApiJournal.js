import { api as auth } from "./ApiAuth";

const buildQS = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

export const api = {
  async list(params = {}) {
    return auth._request(`/journal${buildQS(params)}`, { method: "GET" });
  },

  async create(payload) {
    return auth._request(`/journal`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
