import API from "./axios";

export const normalizeAsset = (asset) => {
  if (!asset || typeof asset !== "object") return asset;
  const id = asset.id || asset._id;
  return {
    ...asset,
    id: id ? String(id) : undefined,
    _id: asset._id || id,
  };
};

export const getAssets = async (params = {}) => {
  const res = await API.get("/assets", { params });
  if (res?.data) {
    if (Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map(normalizeAsset);
    } else if (Array.isArray(res.data)) {
      res.data = res.data.map(normalizeAsset);
    }
  }
  return res;
};

export const getAssetById = async (id) => {
  const res = await API.get(`/assets/${id}`);
  if (res?.data) {
    const item = res.data.data || res.data;
    if (item && typeof item === "object") {
      const normalized = normalizeAsset(item);
      if (res.data.data) res.data.data = normalized;
      else res.data = normalized;
    }
  }
  return res;
};

export const createAsset = async (data) => {
  const res = await API.post("/assets", data);
  if (res?.data) {
    const item = res.data.data || res.data;
    if (item && typeof item === "object") {
      const normalized = normalizeAsset(item);
      if (res.data.data) res.data.data = normalized;
      else res.data = normalized;
    }
  }
  return res;
};

export const updateAsset = async (id, data) => {
  const res = await API.put(`/assets/${id}`, data);
  if (res?.data) {
    const item = res.data.data || res.data;
    if (item && typeof item === "object") {
      const normalized = normalizeAsset(item);
      if (res.data.data) res.data.data = normalized;
      else res.data = normalized;
    }
  }
  return res;
};

export const deleteAsset = (id) => API.delete(`/assets/${id}`);

export const discoverAssets = async () => {
  const res = await API.get("/assets/discover");
  if (res?.data) {
    const item = res.data.data || res.data;
    if (Array.isArray(item)) {
      const normalized = item.map(normalizeAsset);
      if (res.data.data) res.data.data = normalized;
      else res.data = normalized;
    } else if (item && typeof item === "object") {
      const normalized = normalizeAsset(item);
      if (res.data.data) res.data.data = normalized;
      else res.data = normalized;
    }
  }
  return res;
};

export const scanNetwork = (subnet) => API.get("/assets/scan", { params: { subnet } });

export const searchAssets = async (keyword) => {
  const res = await API.get("/assets/search", { params: { keyword } });
  if (res?.data) {
    const item = res.data.data || res.data;
    if (Array.isArray(item)) {
      const normalized = item.map(normalizeAsset);
      if (res.data.data) res.data.data = normalized;
      else res.data = normalized;
    }
  }
  return res;
};

