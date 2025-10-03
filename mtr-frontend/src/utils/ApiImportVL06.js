// ... остальной импорт
import { SERVERNAME } from "../constants/server";
import toISODate from "./toISODate";
import { api as auth } from "./ApiAuth";

const mapRow = ({ vacationOfTheMaterial, status, ...rest }) => {
  const n = typeof status === "number" ? status : parseInt(status, 10);
  return {
    ...rest,
    status: Number.isFinite(n) ? n : 10,
    vacationOfTheMaterial: toISODate(vacationOfTheMaterial),
  };
};

class ApiImportVL06 {
  constructor(options) {
    this._baseUrl = options.baseUrl;
  }

  // Новая версия: порционная загрузка
  async createMTRFromImportVL06(
    data,
    { chunkSize = 200, onProgress } = {}
  ) {
    const payload = data.map(mapRow);
    let done = 0;

    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);

      await auth._request(`/vl06/bulk`, {
        method: "POST",
        body: JSON.stringify(chunk),
      });

      done += chunk.length;
      if (typeof onProgress === "function") {
        onProgress({ done, total: payload.length });
      }
    }

    return { success: true, count: payload.length };
  }

  async vl06(payload) {
    return auth._request(`/vl06`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateVl06(id, dto) {
    return auth._request(`/vl06/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  }

  async updateStatus(id, status) {
    return auth._request(`/vl06/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async updateStatuses(ids, status) {
    return auth._request(`/vl06/status/bulk`, {
      method: "PATCH",
      body: JSON.stringify({ ids, status }),
    });
  }

  async getMTRFromImportVL06ForZapiski({ unusedOnly = true, allowedZapiskaId } = {}) {
    const qs = new URLSearchParams();
    if (unusedOnly) qs.set("unusedOnly", "1");
    if (allowedZapiskaId) qs.set("allowedZapiskaId", String(allowedZapiskaId));
    const q = qs.toString();
    return auth._request(`/vl06${q ? `?${q}` : ""}`, { method: "GET" });
  }
}

export const api = new ApiImportVL06({ baseUrl: SERVERNAME });
