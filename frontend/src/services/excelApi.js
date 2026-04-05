// src/services/excelApi.js

import api from "./api";

export const uploadExcel = async (eventId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(
    `/events/${eventId}/upload-excel`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const importExcel = async (eventId, mapping) => {
  const res = await api.post(
    `/events/${eventId}/import-excel`,
    {
      mapping,
    }
  );

  return res.data;
};