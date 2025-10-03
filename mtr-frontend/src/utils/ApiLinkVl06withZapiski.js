import { HEADERTHISCONTENTTYPE, SERVERNAME } from "../constants/server";

class ApiLinkVl06withZapiski {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  createLink(data) {
    return fetch(`${this._baseUrl}/link-vl06-zapiski`, {
      method: "POST",
      headers: HEADERTHISCONTENTTYPE,
      body: JSON.stringify(data),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .catch(console.log);
  }

  getLink() {
    return fetch(`${this._baseUrl}/link-vl06-zapiski`, {
      method: "GET",
      headers: HEADERTHISCONTENTTYPE,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .catch(console.log);
  }

  //Получить все VL06, связанные с запиской
  getLinksByZapiskaId(zapiskaId) {
    return fetch(`${this._baseUrl}/link-vl06-zapiski/${zapiskaId}`, {
      method: "GET",
      headers: HEADERTHISCONTENTTYPE,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .catch(console.log);
  }

  replaceLinksByZapiskaId(zapiskaId, data) {
    return fetch(`${this._baseUrl}/link-vl06-zapiski/${zapiskaId}`, {
      method: "PATCH",
      headers: HEADERTHISCONTENTTYPE,
      body: JSON.stringify(data),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .catch(console.log);
  }
}

export const api = new ApiLinkVl06withZapiski({
  baseUrl: SERVERNAME,
});
