import axios from "axios";
import { Platform } from "react-native";

// Пробуем реальный IP вашего компьютера
const API_URL = "http://192.168.3.185:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // Увеличим таймаут
});

api.interceptors.request.use((request) => {
  console.log(
    "Starting Request:",
    request.method?.toUpperCase(),
    request.url,
    "to",
    request.baseURL,
  );
  return request;
});

api.interceptors.response.use(
  (response) => {
    console.log("Response:", response.status);
    return response;
  },
  (error) => {
    console.log("Response Error:", error.message);
    return Promise.reject(error);
  },
);

export default api;
