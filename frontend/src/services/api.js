import axios from "axios";

// 🔥 This automatically switches between local & deployed backend
const API = import.meta.env.VITE_API_URL ;

export const explainCode = async (payload) => {
  const res = await axios.post(`${API}/api/explain`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

export const runCode = async (payload) => {
  const res = await axios.post(`${API}/api/run`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

export const downloadReport = async (payload) => {
  const res = await axios.post(`${API}/api/report/download`, payload, {
    responseType: "blob",
    headers: { "Content-Type": "application/json" },
  });
  return res;
};