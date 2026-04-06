import DashboardLayout
from "../layouts/DashboardLayout";
import { useState } from "react";

function FormPreview() {

  const [questions] = useState(() => {
    const raw = localStorage.getItem("form_draft_questions");
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  return (

    <DashboardLayout>

      <h2 className="text-2xl font-bold mb-6">

        Form Preview

      </h2>

      <div className="bg-white p-6 rounded-xl shadow">

        {questions.length === 0 && (
          <p>No saved questions yet.</p>
        )}

        {questions.map((q) => (
          <div key={q.id} className="mb-4">
            <label className="block font-medium mb-1">
              {q.question_text}
              {q.is_required ? " *" : ""}
            </label>

            <input className="border p-2 rounded w-full" placeholder={q.field_type} disabled />
          </div>
        ))}

      </div>

    </DashboardLayout>

  );

}

export default FormPreview;