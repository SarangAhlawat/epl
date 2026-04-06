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
  const [uploadToken, setUploadToken] = useState("");
  const [suggestedMapping, setSuggestedMapping] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [importedCount, setImportedCount] = useState(0);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  // Step 1 — Upload Excel
  const handleFileSelect =
    async (file) => {

      try {
        setLoading(true);
        setSuccess(false);

        const data =
          await uploadExcel(
            eventId,
            file
          );

        setColumns(data.columns || []);
        setUploadToken(data.upload_token || "");
        setSuggestedMapping(data.suggested_mapping || {});
        setPreviewRows(data.preview_rows || []);

      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          err?.response?.data?.message;
        alert(
          detail
            ? `Failed to upload file: ${detail}`
            : "Failed to upload Excel"
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

        const result = await importExcel(
          eventId,
          uploadToken,
          mapping
        );

        setSuccess(true);
        setImportedCount(result?.imported || 0);
        setColumns([]);
        setUploadToken("");
        setPreviewRows([]);

      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          err?.response?.data?.message;

        alert(
          detail
            ? `Import failed: ${detail}`
            : "Import failed"
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

          Attendees imported successfully{importedCount ? ` (${importedCount} preview rows)` : ""}!

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
        <div className="space-y-6">
          <ColumnMapper
            columns={columns}
            suggestedMapping={suggestedMapping}
            onSubmit={
              handleMappingSubmit
            }
          />
          {previewRows.length > 0 && (
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold mb-2">Preview rows</h3>
              <div className="overflow-x-auto">
                <table className="text-sm min-w-full">
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th key={c} className="text-left px-2 py-1 border-b">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i}>
                        {columns.map((c) => (
                          <td key={`${i}-${c}`} className="px-2 py-1 border-b">{r[c] || ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}