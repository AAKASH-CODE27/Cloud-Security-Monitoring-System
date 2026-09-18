// src/api/axios.js

import axios from "axios";

/* =====================================================
   AXIOS INSTANCE
===================================================== */

const API = axios.create({
  baseURL: "http://localhost:8080/api",

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  timeout: 15000,
});

/* =====================================================
   REQUEST INTERCEPTOR
   Attach JWT token automatically
===================================================== */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    /* -------------------------------------------------
       Ensure headers object exists
    ------------------------------------------------- */

    config.headers = config.headers || {};

    /* -------------------------------------------------
       Basic request logging
    ------------------------------------------------- */

    console.log(
      "========================================"
    );

    console.log(
      "API REQUEST"
    );

    console.log(
      "METHOD:",
      config.method?.toUpperCase()
    );

    console.log(
      "URL:",
      `${config.baseURL || ""}${config.url || ""}`
    );

    console.log(
      "TOKEN:",
      token ? "Token exists" : "Token missing"
    );

    /* -------------------------------------------------
       Attach JWT
    ------------------------------------------------- */

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;

      console.log(
        "AUTHORIZATION:",
        "Bearer token attached"
      );
    } else {
      delete config.headers.Authorization;

      console.warn(
        "WARNING: JWT token is missing."
      );
    }

    /* -------------------------------------------------
       Additional debug information
    ------------------------------------------------- */

    console.log(
      "HEADERS:",
      config.headers
    );

    console.log(
      "========================================"
    );

    return config;
  },

  (error) => {
    console.error(
      "Axios request interceptor error:",
      error
    );

    return Promise.reject(error);
  }
);

/* =====================================================
   RESPONSE INTERCEPTOR
===================================================== */

API.interceptors.response.use(
  (response) => {
    console.log(
      "========================================"
    );

    console.log(
      "API RESPONSE SUCCESS"
    );

    console.log(
      "STATUS:",
      response.status
    );

    console.log(
      "URL:",
      response.config?.url
    );

    console.log(
      "DATA:",
      response.data
    );

    console.log(
      "========================================"
    );

    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    const data =
      error.response?.data;

    const url =
      error.config?.url;

    const method =
      error.config?.method?.toUpperCase();

    console.error(
      "========================================"
    );

    console.error(
      "API REQUEST FAILED"
    );

    console.error(
      "METHOD:",
      method
    );

    console.error(
      "URL:",
      url
    );

    console.error(
      "STATUS:",
      status
    );

    console.error(
      "RESPONSE:",
      data
    );

    console.error(
      "========================================"
    );

    /* =================================================
       401 - UNAUTHORIZED

       Token is missing, expired, invalid, or the
       backend rejected authentication.
    ================================================= */

    if (status === 401) {
      console.warn(
        "401 Unauthorized - clearing authentication."
      );

      localStorage.removeItem("token");

      localStorage.removeItem(
        "currentUser"
      );

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.href =
          "/login";
      }
    }

    /* =================================================
       403 - FORBIDDEN

       IMPORTANT:
       Do NOT remove the JWT here.

       A 403 normally means the backend received the
       request but authorization was denied.
    ================================================= */

    if (status === 403) {
      console.error(
        "403 Forbidden - authentication may exist, " +
        "but Spring Security rejected authorization."
      );

      console.error(
        "403 RESPONSE BODY:",
        data
      );

      console.error(
        "403 REQUEST URL:",
        url
      );

      console.error(
        "Check JwtAuthenticationFilter, " +
        "CustomUserDetailsService, authorities, " +
        "SecurityConfig and @PreAuthorize."
      );
    }

    /* =================================================
       404 - NOT FOUND
    ================================================= */

    if (status === 404) {
      console.error(
        "404 Not Found:",
        url
      );
    }

    /* =================================================
       400 - BAD REQUEST
    ================================================= */

    if (status === 400) {
      console.error(
        "400 Bad Request:",
        data
      );
    }

    /* =================================================
       405 - METHOD NOT ALLOWED
    ================================================= */

    if (status === 405) {
      console.error(
        "405 Method Not Allowed:",
        method,
        url
      );
    }

    /* =================================================
       500+ - SERVER ERROR
    ================================================= */

    if (
      status &&
      status >= 500
    ) {
      console.error(
        "Backend server error:",
        data
      );
    }

    /* =================================================
       NETWORK ERROR

       No HTTP response was returned.
    ================================================= */

    if (!error.response) {
      console.error(
        "Network error: backend may be offline " +
        "or unreachable."
      );
    }

    return Promise.reject(error);
  }
);

export default API;