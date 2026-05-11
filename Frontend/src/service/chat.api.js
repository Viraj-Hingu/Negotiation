import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "/api";

export const sendMessage = async (message) => {
  const res = await axios.post(`${BASE}/aimessage`, { message });
  return res.data;
};

export const resetChat = async () => {
  const res = await axios.post(`${BASE}/reset`);
  return res.data;
};
