import { api as auth } from "../utils/ApiAuth";

class ApiNotifications {
  unreadCount() {
    return auth._request(`/notifications/unread-count`, { method: "GET" });
  }
  list({ limit = 20, offset = 0 } = {}) {
    const q = `?limit=${limit}&offset=${offset}`;
    return auth._request(`/notifications${q}`, { method: "GET" });
  }
  markRead(id) {
    return auth._request(`/notifications/${id}/read`, { method: "POST" });
  }
  markAllRead() {
    return auth._request(`/notifications/read-all`, { method: "POST" });
  }
}

export const apiNotifications = new ApiNotifications();
