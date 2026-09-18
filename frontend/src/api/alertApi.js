import API from "./axios";

export const getAlerts = (params = {}) => API.get("/alerts", { params });
export const getRecentAlerts = (limit = 10) => API.get("/alerts/recent", { params: { limit } });
export const createAlert = (data) => API.post("/alerts", data);
export const updateAlert = (id, data) => API.put(`/alerts/${id}`, data);
export const deleteAlert = (id) => API.delete(`/alerts/${id}`);
