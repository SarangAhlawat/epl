// src/components/ColumnMapper.jsx

import { useState } from "react";

const SYSTEM_FIELDS = [
  "name",
  "email",
  "roll_number",
  "phone",
];

export default function ColumnMapper({
  columns,
  onSubmit,
}) {
  const [mapping, setMapping] = useState({});

  const handleChange = (column, value) => {
    setMapping({
      ...mapping,
      [column]: value,
    });
  };

  const handleSubmit = () => {
    onSubmit(mapping);
  };

  return (
    <div className="mt-6">

      <h2 className="text-lg font-semibold mb-4">
        Map Excel Columns
      </h2>

      <div className="space-y-4">

        {columns.map((column) => (
          <div
            key={column}
            className="flex items-center gap-4"
          >

            <div className="w-1/2 font-medium">
              {column}
            </div>

            <select
              className="border p-2 rounded w-1/2"
              onChange={(e) =>
                handleChange(
                  column,
                  e.target.value
                )
              }
            >

              <option value="">
                Select Field
              </option>

              {SYSTEM_FIELDS.map((field) => (
                <option
                  key={field}
                  value={field}
                >
                  {field}
                </option>
              ))}

            </select>

          </div>
        ))}

      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Import Attendees
      </button>

    </div>
  );
}