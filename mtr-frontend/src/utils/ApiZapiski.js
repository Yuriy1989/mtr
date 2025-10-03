import { SERVERNAME } from "../constants/server";
import { api as auth } from "./ApiAuth";

class ApiZapiski {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  createZapiski(idUSer, regionIds) {
    const data = {
      id: idUSer,
      region: Array.isArray(regionIds) ? regionIds : undefined,
    };
    return auth._request(`/zapiski`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getDataForZapiski() {
    return auth._request(`/vl06`, { method: "GET" });
  }

  getIdZapiski(id) {
    return auth._request(`/zapiski/${id}`, { method: "GET" });
  }

  getAllZapiski(params) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const q = qs.toString();
    return auth._request(`/zapiski${q ? `?${q}` : ""}`, { method: "GET" });
  }

  deleteZapiska(id) {
    return auth._request(`/zapiski/${id}`, { method: "DELETE" });
  }

  updateStatus(id, status) {
    return auth._request(`/zapiski/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  patchZapiska(id, payload) {
    return auth._request(`/zapiski/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  sendToWork(id) {
    return auth._request(`/zapiski/${id}/send`, { method: "PATCH" });
  }

  sendToSent50(id) {
    return auth._request(`/zapiski/${id}/send50`, { method: "PATCH" });
  }
}

export const api = new ApiZapiski({ baseUrl: SERVERNAME });
