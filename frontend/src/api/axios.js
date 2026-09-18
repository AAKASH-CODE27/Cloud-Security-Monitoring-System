// src/api/axios.js

import axios from "axios";

/* =====================================================
   AXIOS INSTANCE
===================================================== */

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

/* =====================================================
   REQUEST INTERCEPTOR
   Attach JWT token automatically without exposing it in logs
===================================================== */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    if (import.meta.env.DEV) {
      // Safe development logging without sensitive headers or bodies
      // console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   RESPONSE INTERCEPTOR
===================================================== */

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;