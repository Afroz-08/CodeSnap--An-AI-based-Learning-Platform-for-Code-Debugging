import axios from "axios";

export const explainCode = async (payload) => {
  const res = await axios.post(
    "http://127.0.0.1:8000/api/explain",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

export const runCode = async (payload) => {
  const res = await axios.post(
    "http://127.0.0.1:8000/api/run",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

export const downloadReport = async (payload) => {
  const res = await axios.post(
    "http://127.0.0.1:8000/api/report/download",
    payload,
    {
      responseType: 'blob', // Important: receive binary data
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res;
};