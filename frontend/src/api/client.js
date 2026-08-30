import axios from "axios";

const client = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// Interceptor to attach token, except for login/register
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  const isAuthRequest =
    config.url.includes("login/") || config.url.includes("register/");

  if (token && !isAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
