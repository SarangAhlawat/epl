// src/components/FileUploadBox.jsx

import { Upload } from "lucide-react";

export default function FileUploadBox({ onFileSelect }) {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-500 transition">

      <Upload className="mx-auto mb-4 text-blue-600" size={40} />

      <p className="text-gray-600 mb-3">
        Upload Excel File (.xlsx)
      </p>

      <input
        type="file"
        accept=".xlsx"
        onChange={handleChange}
        className="cursor-pointer"
      />

    </div>
  );
}