import { SERVERNAME } from "../constants/server";
import { api as auth } from "./ApiAuth";

class ApiUser {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  createUser(data) {
    const payload = {
      ...data,
      department: +data.department,
      storage: data.storage ? +data.storage : undefined,
      region: data.region ? +data.region : undefined,
    };
    return auth._request(`/users`, { method: "POST", body: JSON.stringify(payload) });
  }

  patchUser(data) {
    const payload = {
      ...data,
      department: +data.department,
      storage: data.storage ? +data.storage : undefined,
      region: data.region ? +data.region : undefined,
    };
    return auth._request(`/users`, { method: "PATCH", body: JSON.stringify(payload) });
  }

  getUsers() {
    return auth._request(`/users`, { method: "GET" });
  }

  deleteUsers(data) {
    return auth._request(`/users`, { method: "DELETE", body: JSON.stringify({ id: data[0].id }) });
  }

  async getUser(accessToken) {
    return auth._request(`/auth/user`, { method: "GET" });
  }

  async getUserById(id) {
    return auth._request(`/users/${id}`, { method: "GET" });
  }

  getAdSettings() {
    return auth._request(`/ad/settings`, { method: "GET" });
  }

  updateAdSettings(data) {
    return auth._request(`/ad/settings`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  getAdUsers(search = "") {
    const query = search.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";
    return auth._request(`/ad/users${query}`, { method: "GET" });
  }

  importAdUser(data) {
    const payload = {
      ...data,
      department: +data.department,
      storage: data.storage ? +data.storage : undefined,
      region: data.region ? +data.region : undefined,
    };
    return auth._request(`/ad/users/import`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export const apiUsers = new ApiUser({ baseUrl: SERVERNAME });
