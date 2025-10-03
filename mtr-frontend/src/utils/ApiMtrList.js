import { SERVERNAME } from "../constants/server";
import { api as auth } from "./ApiAuth";

class ApiMtrList {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  createMtrList(data) {
    return auth._request(`/mtr-list`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  createLink(data) {
    return auth._request(`/link-vl06-mtr-list`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getMtrList() {
    return auth._request(`/mtr-list`, { method: "GET" });
  }

  getMtrListForId(zapiskaId) {
    return auth._request(`/mtr-list/${zapiskaId}`, { method: "GET" });
  }

  // ручка для редактирования приложения №3
  getMtrListForIdApp(zapiskaId) {
    return auth
      ._request(`/mtr-list/by-zapiska/${Number(zapiskaId)}`, { method: "GET" })
      .then((r) => r?.data ?? []);
  }

  // если эта ручка у тебя реально есть — оставляем как было, но через общий клиент
  upsertForZapiskaId(zapiskaId, data) {
    return auth._request(`/mtr-list/${zapiskaId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // новая синхронизация (есть на бэке)
  syncForZapiska(zapiskaId, data) {
    return auth._request(`/mtr-list/sync/${zapiskaId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiMtrList({ baseUrl: SERVERNAME });
