// src/pages/ExcelUpload.jsx

import { useState } from "react";
import { useParams } from "react-router-dom";

import FileUploadBox from "../components/FileUploadBox";
import ColumnMapper from "../components/ColumnMapper";

import {
  uploadExcel,
  importExcel,
} from "../services/excelApi";

export default function ExcelUpload() {

  const { eventId } = useParams();

  const [columns, setColumns] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  // Step 1 — Upload Excel
  const handleFileSelect =
    async (file) => {

      try {
        setLoading(true);

        const data =
          await uploadExcel(
            eventId,
            file
          );

        setColumns(data.columns);

      } catch {
        alert(
          "Failed to upload Excel"
        );
      } finally {
        setLoading(false);
      }
    };

  // Step 2 — Import
  const handleMappingSubmit =
    async (mapping) => {

      try {

        setLoading(true);

        await importExcel(
          eventId,
          mapping
        );

        setSuccess(true);

      } catch {

        alert(
          "Import failed"
        );

      } finally {

        setLoading(false);

      }
    };

  return (
    <div className="p-8 max-w-4xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">
        Upload Excel Attendees
      </h1>

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-6">

          Attendees imported successfully!

        </div>
      )}

      {/* Step 1 — Upload */}

      {columns.length === 0 && (
        <FileUploadBox
          onFileSelect={
            handleFileSelect
          }
        />
      )}

      {loading && (
        <p className="mt-4 text-blue-600">

          Processing...

        </p>
      )}

      {/* Step 2 — Mapping */}

      {columns.length > 0 && (
        <ColumnMapper
          columns={columns}
          onSubmit={
            handleMappingSubmit
          }
        />
      )}

    </div>
  );
}