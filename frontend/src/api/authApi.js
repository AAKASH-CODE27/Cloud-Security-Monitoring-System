import API from "./axios";

export const loginApi = (email, password) => API.post("/auth/login", { email, password });
export const registerApi = (userData) => API.post("/auth/register", userData);
export const createAdminUserApi = (userData) => API.post("/auth/create-user", userData);
