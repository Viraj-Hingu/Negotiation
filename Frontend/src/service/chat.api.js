import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const sendMessage = async (message) => {
  const res = await axios.post(`${BASE}/aimessage`, { message });
  return res.data;
};

export const resetChat = async () => {
  const res = await axios.post(`${BASE}/reset`);
  return res.data;
};

export const fetchProducts = async () => {
  const res = await axios.get(`${BASE}/products`);
  return res.data;
};

export const selectProduct = async (id) => {
  const res = await axios.post(`${BASE}/switch/${id}`);
  return res.data;
};
