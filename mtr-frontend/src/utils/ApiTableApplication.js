import { SERVERNAME } from "../constants/server";
import { api as auth } from "./ApiAuth";

class ApiTableApplications {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  // сохранение строк Приложения 3
  createTableApplication(data) {
    return auth._request(`/table-applications`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // строки по id приложения
  getTableApplicationById(id) {
    return auth._request(`/table-applications/${id}`, { method: "GET" });
  }

  // все строки всех приложений (если нужно)
  getTableApplications() {
    return auth._request(`/table-applications`, { method: "GET" });
  }

  patchTableApplication(data) {
    return auth._request(`/table-applications`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteTableApplication(data) {
    return auth._request(`/table-applications`, {
      method: "DELETE",
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiTableApplications({ baseUrl: SERVERNAME });
