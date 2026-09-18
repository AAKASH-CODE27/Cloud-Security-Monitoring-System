import API from "./axios";

export const getAssets = (params = {}) => API.get("/assets", { params });
export const getAssetById = (id) => API.get(`/assets/${id}`);
export const createAsset = (data) => API.post("/assets", data);
export const updateAsset = (id, data) => API.put(`/assets/${id}`, data);
export const deleteAsset = (id) => API.delete(`/assets/${id}`);
export const discoverAssets = () => API.get("/assets/discover");
export const scanNetwork = (subnet) => API.get("/assets/scan", { params: { subnet } });
export const searchAssets = (keyword) => API.get("/assets/search", { params: { keyword } });
