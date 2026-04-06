import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import API from "../services/api";

function fieldInput(q, value, onChange, disabled) {

  const base =

    "border border-slate-200 p-2.5 w-full rounded-lg text-slate-900 bg-white";

  switch (q.field_type) {

    case "long_text":

      return (

        <textarea

          required={q.is_required}

          className={base}

          rows={4}

          value={value}

          disabled={disabled}

          onChange={(e) => onChange(e.target.value)}

        />

      );

    case "dropdown":

      return (

        <select

          required={q.is_required}

          className={base}

          value={value}

          disabled={disabled}

          onChange={(e) => onChange(e.target.value)}

        >

          <option value="">Select…</option>

          {(q.options || []).map((o) => (

            <option key={o} value={o}>

              {o}

            </option>

          ))}

        </select>

      );

    case "radio":

      return (

        <div className="space-y-2">

          {(q.options || []).map((o) => (

            <label key={o} className="flex items-center gap-2 text-sm">

              <input

                type="radio"

                name={q.id}

                value={o}

                required={q.is_required}

                checked={value === o}

                disabled={disabled}

                onChange={() => onChange(o)}

              />

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

              <input

                type="checkbox"

                checked={(value || "").split(",").includes(o)}

                disabled={disabled}

                onChange={(e) => {

                  const cur = new Set(

                    (value || "")

                      .split(",")

                      .map((x) => x.trim())

                      .filter(Boolean)

                  );

                  if (e.target.checked) cur.add(o);

                  else cur.delete(o);

                  onChange([...cur].join(", "));

                }}

              />

              {o}

            </label>

          ))}

        </div>

      );

    case "file_upload":

      return (

        <input

          type="file"

          disabled={disabled}

          className="text-sm w-full"

          onChange={(e) => {

            const f = e.target.files?.[0];

            onChange(f ? f.name : "");

          }}

        />

      );

    default:

      return (

        <input

          required={q.is_required}

          className={base}

          value={value}

          disabled={disabled}

          onChange={(e) => onChange(e.target.value)}

        />

      );

  }

}

function PublicEventRegister() {

  const { eventId } = useParams();

  const [ctx, setCtx] = useState(null);

  const [base, setBase] = useState({ name: "", email: "", roll_number: "" });

  const [responses, setResponses] = useState({});

  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);

  useEffect(() => {

    API.get(`/form/public-context/${eventId}`).then((res) => {

      setCtx(res.data);

    });

  }, [eventId]);

  const questions = useMemo(() => {

    if (!ctx || ctx.status === "event_not_found") return [];

    return ctx.questions || [];

  }, [ctx]);

  const setAns = (qid, v) => {

    setResponses((prev) => ({ ...prev, [qid]: v }));

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");

    if (!ctx || ctx.status === "event_not_found") {

      setMessage("Event not found.");

      return;

    }

    if (!ctx.registration_open) {

      setMessage("Registration is closed for this event.");

      return;

    }

    if (!ctx.form_published) {

      setMessage("The organizer has not published the registration form yet.");

      return;

    }

    if (questions.length === 0) {

      setMessage("No registration form is configured.");

      return;

    }

    setBusy(true);

    try {

      await API.post("/form/submit", {

        event_id: eventId,

        name: base.name,

        email: base.email,

        roll_number: base.roll_number,

        responses

      });

      setMessage("Registration submitted successfully.");

      setBase({ name: "", email: "", roll_number: "" });

      setResponses({});

    } catch (err) {

      const d = err.response?.data?.detail;

      setMessage(

        typeof d === "string"

          ? d

          : "Could not submit registration. Check required fields."

      );

    } finally {

      setBusy(false);

    }

  };

  if (!ctx) {

    return (

      <MainLayout>

        <p className="text-center py-20 text-slate-600">Loading…</p>

      </MainLayout>

    );

  }

  if (ctx.status === "event_not_found") {

    return (

      <MainLayout>

        <section className="max-w-lg mx-auto px-6 py-16">

          <h1 className="text-2xl font-bold text-slate-900">Event not found</h1>

        </section>

      </MainLayout>

    );

  }

  const ev = ctx.event;

  const blocked = !ctx.form_published || !ctx.registration_open;

  return (

    <MainLayout>

      <section

        className="max-w-xl mx-auto px-6 py-14"

        style={

          ev.theme_color

            ? { borderTop: `4px solid ${ev.theme_color}` }

            : undefined

        }

      >

        {ev.logo_url && (

          <img

            src={ev.logo_url}

            alt=""

            className="h-16 w-auto object-contain mb-4 rounded"

          />

        )}

        <h1 className="text-3xl font-bold text-slate-900">{ev.title}</h1>

        {ev.description && (

          <p className="text-slate-600 mt-2 text-sm leading-relaxed">{ev.description}</p>

        )}

        {blocked && (

          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm">

            {!ctx.registration_open

              ? "Registration is currently closed."

              : "Registration is not open yet (form unpublished)."}

          </div>

        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">

          <div>

            <label className="block text-sm font-medium text-slate-700 mb-1">

              Full name *

            </label>

            <input

              required

              value={base.name}

              disabled={blocked}

              onChange={(e) => setBase({ ...base, name: e.target.value })}

              className="border border-slate-200 p-2.5 w-full rounded-lg"

            />

          </div>

          <div>

            <label className="block text-sm font-medium text-slate-700 mb-1">

              Email *

            </label>

            <input

              required

              type="email"

              value={base.email}

              disabled={blocked}

              onChange={(e) => setBase({ ...base, email: e.target.value })}

              className="border border-slate-200 p-2.5 w-full rounded-lg"

            />

          </div>

          <div>

            <label className="block text-sm font-medium text-slate-700 mb-1">

              Roll / ID

            </label>

            <input

              value={base.roll_number}

              disabled={blocked}

              onChange={(e) => setBase({ ...base, roll_number: e.target.value })}

              className="border border-slate-200 p-2.5 w-full rounded-lg"

            />

          </div>

          {questions.map((q) => (

            <div key={q.id}>

              <label className="block text-sm font-medium text-slate-700 mb-1">

                {q.question_text}

                {q.is_required ? " *" : ""}

              </label>

              {fieldInput(

                q,

                responses[q.id] ?? "",

                (v) => setAns(q.id, v),

                blocked

              )}

            </div>

          ))}

          {questions.length === 0 && !blocked && (

            <p className="text-sm text-slate-600">

              The organizer has not added form fields yet.

            </p>

          )}

          <button

            type="submit"

            disabled={busy || blocked || questions.length === 0}

            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"

          >

            {busy ? "Submitting…" : "Submit registration"}

          </button>

        </form>

        {message && (

          <p className="mt-4 text-sm text-slate-700 px-1">{message}</p>

        )}

      </section>

    </MainLayout>

  );

}

export default PublicEventRegister;
