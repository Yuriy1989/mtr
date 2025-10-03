// src/utils/ApiDirectories.js
import { SERVERNAME } from "../constants/server";
import { api as auth } from "./ApiAuth";

class Api {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  // ---------- Departments ----------
  createDepartment(data) {
    return auth._request(`/departments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getDepartmentsAll() {
    return auth._request(`/departments`, { method: "GET" });
  }

  patchDepartment(data) {
    const payload = {
      id: data.id,
      nameDepartment: data.name,
      numberDepartment: data.numberDepartment,
    };
    return auth._request(`/departments`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  deleteDepartment(row) {
    return auth._request(`/departments`, {
      method: "DELETE",
      body: JSON.stringify({ id: row.id }),
    });
  }

  // ---------- Filials ----------
  createFilial(data) {
    return auth._request(`/filials`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getFilialsAll() {
    return auth._request(`/filials`, { method: "GET" });
  }

  patchFilial(data) {
    const payload = { id: data.id, nameFilial: data.nameFilial };
    return auth._request(`/filials`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  deleteFilial(rows) {
    return auth._request(`/filials`, {
      method: "DELETE",
      body: JSON.stringify({ id: rows[0].id }),
    });
  }

  // ---------- Storages ----------
  createStorage(data) {
    return auth._request(`/storages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getStoragesAll() {
    return auth._request(`/storages`, { method: "GET" });
  }

  patchStorage(data) {
    const payload = { id: data.id, name: data.name };
    return auth._request(`/storages`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  deleteStorage(rows) {
    return auth._request(`/storages`, {
      method: "DELETE",
      body: JSON.stringify({ id: rows[0].id }),
    });
  }

  // ---------- Regions ----------
  createRegion(data) {
    return auth._request(`/regions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getRegionsAll() {
    return auth._request(`/regions`, { method: "GET" });
  }

  patchRegion(data) {
    const payload = {
      id: data.id,
      name: data.nameRegion,
      codeRegion: data.codeRegion,
    };
    return auth._request(`/regions`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  deleteRegion(rows) {
    return auth._request(`/regions`, {
      method: "DELETE",
      body: JSON.stringify({ id: rows[0].id }),
    });
  }

  // ---------- Dimensions ----------
  createDimension(data) {
    // ожидаем { nameDimension, code, category, isBase, toBaseFactor, aliases?: string[] }
    return auth._request(`/dimensions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getDimensionsAll() {
    // вернёт объекты с полем aliases: string[]
    return auth._request(`/dimensions`, { method: "GET" });
  }

  // PATCH /dimensions/:id
  patchDimension({ id, ...rest }) {
    const idNum = Number(id);
    return auth._request(`/dimensions/${idNum}`, {
      method: "PATCH",
      body: JSON.stringify(rest), // без id
    });
  }

  // DELETE /dimensions/:id
  deleteDimension(id) {
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      return Promise.reject(new Error("deleteDimension: invalid id"));
    }
    return auth._request(`/dimensions/${idNum}`, { method: "DELETE" });
  }

  // ---------- Dimension Categories ----------
  getDimensionCategories() {
    return auth._request(`/dimensions/categories`, { method: "GET" });
  }

  upsertDimensionCategory(itemOrList) {
    return auth._request(`/dimensions/categories`, {
      method: "PATCH",
      body: JSON.stringify(itemOrList),
    });
  }

  // ---------- Deliveries ----------
  createDeliverie(data) {
    return auth._request(`/deliveries`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getDeliveriesAll() {
    return auth._request(`/deliveries`, { method: "GET" });
  }

  patchDeliverie(data) {
    const payload = { id: data.id, nameDelivery: data.nameDelivery };
    return auth._request(`/deliveries`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  deleteDeliverie(rows) {
    return auth._request(`/deliveries`, {
      method: "DELETE",
      body: JSON.stringify({ id: rows[0].id }),
    });
  }

  // ---------- Activities ----------
  createActivitie(data) {
    return auth._request(`/activities`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getActivitiesAll() {
    return auth._request(`/activities`, { method: "GET" });
  }

  patchActivitie(data) {
    const payload = { id: data.id, nameActivity: data.nameActivity };
    return auth._request(`/activities`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  deleteActivitie(rows) {
    return auth._request(`/activities`, {
      method: "DELETE",
      body: JSON.stringify({ id: rows[0].id }),
    });
  }
}

export const api = new Api({ baseUrl: SERVERNAME });
