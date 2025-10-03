import { SERVERNAME } from "../constants/server";
import { api as auth } from "./ApiAuth";

class Api {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  createOrder(data) {
    const user = 2;
    const dataTest = { region: data.regions, storage: data.storage, user };
    return auth._request(`/orders`, {
      method: "POST",
      body: JSON.stringify(dataTest),
    });
  }

  getOrders() {
    return auth._request(`/orders`, { method: "GET" });
  }

  getOrderById(id) {
    return auth._request(`/orders/${id}`, { method: "GET" });
  }
}

export const api = new Api({ baseUrl: SERVERNAME });
