import { SERVERNAME } from "../constants/server";
import { api as apiAuth } from "./ApiAuth"; // ← переиспользуем авторизованный _request

class ApiLastmile {
  constructor({ baseUrl }) {
    this._baseUrl = baseUrl;
  }

  // ВАЖНО: все запросы делаем через apiAuth._request,
  // чтобы автоматически добавлялся Authorization и работал авто-refresh.
  _request(path, options = {}) {
    // path должен начинаться с '/', как в других утилитах
    return apiAuth._request(path, options);
  }

  // Список «на приёмку»
  pending({ days = 7, status } = {}) {
    const qs = new URLSearchParams();
    if (days != null) qs.set("days", String(days));
    if (status != null) qs.set("status", String(status));
    return this._request(`/lastmile/pending?${qs.toString()}`, { method: "GET" });
  }

  // Карточка приёмки (редактируемая)
  getAcceptance(appId) {
    return this._request(`/lastmile/acceptance/${appId}`, { method: "GET" });
  }

  // Завершить приёмку
  accept(appId, decisions) {
    return this._request(`/lastmile/accept/${appId}`, {
      method: "POST",
      body: JSON.stringify(decisions),
    });
  }

  // Реестр — список завершённых
  registry({ days = 30 } = {}) {
    const qs = new URLSearchParams();
    if (days != null) qs.set("days", String(days));
    return this._request(`/lastmile/registry?${qs.toString()}`, { method: "GET" });
  }

  // Просмотр карточки реестра (read-only).
  async registryDetail(appId) {
    try {
      return await this._request(`/lastmile/registry/${appId}`, { method: "GET" });
    } catch (e) {
      if (e?.status === 404 || e?.status === 405) {
        // fallback: используем те же данные, что и карточка приёмки
        return this._request(`/lastmile/acceptance/${appId}`, { method: "GET" });
      }
      throw e;
    }
  }
}

export const api = new ApiLastmile({ baseUrl: SERVERNAME });
