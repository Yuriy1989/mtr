import { SERVERNAME } from "../constants/server";
import { api as auth } from "./ApiAuth";

class ApiTable {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  // сохранение данных из таблицы распоряжения
  createTableOrder(data) {
    return auth._request(`/table-order`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // данные по ID распоряжения
  getTableOrder(id) {
    return auth._request(`/table-order/${id}`, { method: "GET" });
  }

  // все распоряжения
  getTableOrders() {
    return auth._request(`/orders`, { method: "GET" });
  }

  patchTableOrder(data) {
    return auth._request(`/table-order`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteTableOrder(data) {
    return auth._request(`/table-order`, {
      method: "DELETE",
      body: JSON.stringify(data),
    });
  }
}

export const apiTable = new ApiTable({ baseUrl: SERVERNAME });
