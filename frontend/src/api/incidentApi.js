import API from "./axios";

export const getIncidents = (params = {}) => API.get("/incidents", { params });
export const getIncidentById = (id) => API.get(`/incidents/${id}`);
export const createIncident = (data) => API.post("/incidents", data);
export const updateIncident = (id, data) => API.put(`/incidents/${id}`, data);
export const deleteIncident = (id) => API.delete(`/incidents/${id}`);
