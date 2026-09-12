import axios from "axios";
//import.meta.env.VITE_RENDER_URL
const api = axios.create({
  baseURL: "http://localhost:4996",
  withCredentials: true,
});

const PUBLIC_PATHS = ["/login", "/register", "/verify-email"];

// A stale cookie (expired token, or an account deleted from the database) is
// reported by the server as SESSION_INVALID. Anonymous visitors get NO_SESSION
// instead and are left alone so public pages keep working.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error.response?.data?.code;
    const onPublicPath = PUBLIC_PATHS.some((p) =>
      window.location.pathname.startsWith(p),
    );

    if (code === "SESSION_INVALID" && !onPublicPath) {
      // Full reload rather than a router navigation, so every piece of state
      // tied to the removed account is discarded.
      window.location.replace("/login");
    }

    return Promise.reject(error);
  },
);

export default api;
