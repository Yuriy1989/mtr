// src/utils/ApiTransports.js
import { SERVERNAME } from "../constants/server";
import { api as auth } from "./ApiAuth";

class ApiTransports {
  constructor({ baseUrl }) {
    this._baseUrl = baseUrl;
  }

  // GET /transports?status=10
  list(status) {
    const qs = status != null ? `?status=${encodeURIComponent(status)}` : "";
    return auth
      ._request(`/transports${qs}`, { method: "GET" })
      .then((r) => r?.data ?? []);
  }

  // GET /transports/by-application/:appId
  byApplication(appId) {
    return auth
      ._request(`/transports/by-application/${appId}`, { method: "GET" })
      .then((r) => r?.data ?? []);
  }

  // POST /transports/from-application/:appId
  createFromApplication(appId) {
    return auth._request(`/transports/from-application/${appId}`, {
      method: "POST",
    });
  }

  // PATCH /transports/:id/approve
  approve(id) {
    return auth._request(`/transports/${id}/approve`, { method: "PATCH" });
  }

  // PATCH /transports/:id/reject { reason }
  reject(id, reason) {
    return auth._request(`/transports/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  }

  approveForApplication(applicationId) {
    return auth._request(`/transports/approve/app/${applicationId}`, {
      method: "PATCH",
    });
  }

  rejectForApplication(applicationId, reason) {
    return auth._request(`/transports/reject/app/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  }
}

export const api = new ApiTransports({ baseUrl: SERVERNAME });
