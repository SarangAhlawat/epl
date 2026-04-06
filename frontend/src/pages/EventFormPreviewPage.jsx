import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";

function renderField(q) {

  const base =

    "w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-slate-50";

  switch (q.field_type) {

    case "long_text":

      return <textarea className={base} rows={3} disabled placeholder="Answer" />;

    case "dropdown":

      return (

        <select className={base} disabled>

          <option>Select…</option>

          {(q.options || []).map((o) => (

            <option key={o}>{o}</option>

          ))}

        </select>

      );

    case "radio":

      return (

        <div className="space-y-2">

          {(q.options || []).map((o) => (

            <label key={o} className="flex items-center gap-2 text-sm">

              <input type="radio" disabled name={q.id} />

              {o}

            </label>

          ))}

        </div>

      );

    case "checkbox":

      return (

        <div className="space-y-2">

          {(q.options || []).map((o) => (

            <label key={o} className="flex items-center gap-2 text-sm">

              <input type="checkbox" disabled />

              {o}

            </label>

          ))}

        </div>

      );

    case "file_upload":

      return <input type="file" disabled className="text-sm" />;

    default:

      return <input className={base} disabled placeholder="Short answer" />;

  }

}

function EventFormPreviewPage() {

  const { eventId } = useParams();

  const [title, setTitle] = useState("");

  const [questions, setQuestions] = useState([]);

  useEffect(() => {

    API.get(`/events/${eventId}`).then((res) => {

      if (res.data?.title) setTitle(res.data.title);

    });

    API.get(`/form/get-form/${eventId}`).then((res) => {

      setQuestions(Array.isArray(res.data) ? res.data : []);

    });

  }, [eventId]);

  return (

    <DashboardLayout>

      <div className="max-w-xl mx-auto">

        <div className="flex justify-between items-center mb-6">

          <Link

            to={`/dashboard/event/${eventId}/forms`}

            className="text-sm text-blue-700 hover:underline"

          >

            ← Back to editor

          </Link>

        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          <h1 className="text-xl font-bold text-slate-900">Registration preview</h1>

          {title && <p className="text-slate-600 mt-1 text-sm">{title}</p>}

          <div className="mt-6 space-y-5 border-t border-slate-100 pt-6">

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-1">

                Full name *

              </label>

              <input

                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"

                disabled

                placeholder="Required on live form"

              />

            </div>

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-1">

                Email *

              </label>

              <input

                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"

                disabled

                placeholder="Required on live form"

              />

            </div>

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-1">

                Roll / ID

              </label>

              <input

                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"

                disabled

                placeholder="Optional"

              />

            </div>

            {questions.map((q) => (

              <div key={q.id}>

                <label className="block text-sm font-medium text-slate-700 mb-1">

                  {q.question_text}

                  {q.is_required ? " *" : ""}

                </label>

                {renderField(q)}

              </div>

            ))}

            {questions.length === 0 && (

              <p className="text-sm text-slate-500">

                No custom questions saved yet. Add questions in the form editor.

              </p>

            )}

            <button

              type="button"

              disabled

              className="w-full bg-slate-200 text-slate-500 font-medium py-2.5 rounded-lg"

            >

              Submit (preview only)

            </button>

          </div>

        </div>

      </div>

    </DashboardLayout>

  );

}

export default EventFormPreviewPage;
