// src/components/FileUploadBox.jsx

import { Upload } from "lucide-react";
import { useState } from "react";

export default function FileUploadBox({ onFileSelect }) {
  const [file, setFile] = useState(null);

  const handleChange = (e) => setFile(e.target.files?.[0] || null);
  const submit = () => {
    if (file) onFileSelect(file);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-500 transition">

      <Upload className="mx-auto mb-4 text-blue-600" size={40} />

      <p className="text-gray-600 mb-3">
        Upload attendee file (.xlsx or .csv)
      </p>

      <input
        type="file"
        accept=".xlsx,.csv"
        onChange={handleChange}
        className="cursor-pointer"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!file}
        className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        <Upload size={16} />
        Upload Excel
      </button>

    </div>
  );
}