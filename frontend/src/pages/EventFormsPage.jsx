import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import FormToolbar from "../components/FormToolbar";
import QuestionBuilder from "../components/QuestionBuilder";
import QuestionList from "../components/QuestionList";
import API from "../services/api";
import { Copy, ExternalLink } from "lucide-react";

function EventFormsPage() {

  const { eventId } = useParams();

  const [eventTitle, setEventTitle] = useState("");

  const [questions, setQuestions] = useState([]);

  const [formPublished, setFormPublished] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(() => {

    API.get(`/events/${eventId}`)

      .then((res) => {

        if (res.data?.status === "event_not_found") {

          setError("Event not found.");

          return;

        }

        setEventTitle(res.data.title || "");

        setFormPublished(!!res.data.form_published);

      })

      .catch(() => setError("Failed to load event."));

    API.get(`/form/get-form/${eventId}`)

      .then((res) => {

        const rows = Array.isArray(res.data) ? res.data : [];

        setQuestions(

          rows.map((q) => ({

            id: q.id,

            question_text: q.question_text,

            field_type: q.field_type,

            is_required: q.is_required,

            options: q.options || [],

            order_index: q.order_index

          }))

        );

      })

      .catch(() => setQuestions([]));

  }, [eventId]);

  useEffect(() => {

    load();

  }, [load]);

  const persistQuestions = async () => {

    setSaving(true);

    setError("");

    setMessage("");

    try {

      const payload = {

        questions: questions.map((q, i) => ({

          id: String(q.id).startsWith("tmp-") ? null : q.id,

          question_text: q.question_text,

          field_type: q.field_type,

          is_required: q.is_required,

          options: q.options || [],

          order_index: i + 1

        }))

      };

      await API.post(`/form/save-form/${eventId}`, payload);

      setMessage("Form saved.");
      setToast("Form saved and refreshed.");
      setTimeout(() => setToast(""), 1600);

      await load();

    } catch {

      setError("Could not save form.");

    } finally {

      setSaving(false);

    }

  };

  const handlePublish = async () => {

    setSaving(true);

    setError("");

    setMessage("");

    try {

      await API.post(`/form/save-form/${eventId}`, {

        questions: questions.map((q, i) => ({

          id: String(q.id).startsWith("tmp-") ? null : q.id,

          question_text: q.question_text,

          field_type: q.field_type,

          is_required: q.is_required,

          options: q.options || [],

          order_index: i + 1

        }))

      });

      await API.post(`/form/publish/${eventId}`);

      setFormPublished(true);

      setMessage("Form published. Share the registration link below.");
      setToast("Form published and refreshed.");
      setTimeout(() => setToast(""), 1800);

      await load();

    } catch (e) {

      const d = e.response?.data?.detail;

      setError(

        typeof d === "string"

          ? d

          : "Publish failed. Save at least one question first."

      );

    } finally {

      setSaving(false);

    }

  };

  const handleAdd = (q) => {

    setQuestions((prev) => [...prev, q]);

  };

  const handleRemove = (id) => {

    setQuestions((prev) => prev.filter((x) => x.id !== id));

  };

  const handleMove = (index, delta) => {

    setQuestions((prev) => {

      const next = [...prev];

      const j = index + delta;

      if (j < 0 || j >= next.length) return prev;

      [next[index], next[j]] = [next[j], next[index]];

      return next;

    });

  };

  const regUrl = `${window.location.origin}/events/${eventId}/register`;

  const copyLink = () => {

    navigator.clipboard.writeText(regUrl);

    setMessage("Registration link copied.");
    setToast("Link copied.");
    setTimeout(() => setToast(""), 1200);

  };

  if (error && error === "Event not found.") {

    return (

      <DashboardLayout>

        <p className="text-red-600">{error}</p>

      </DashboardLayout>

    );

  }

  return (

    <DashboardLayout>

      <div className="max-w-5xl">

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">

          <div>

            <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">

              Event forms

            </p>

            <h1 className="text-2xl font-bold text-slate-900 mt-1">

              {eventTitle || "Loading…"}

            </h1>

            <p className="text-slate-600 mt-2 text-sm max-w-xl">

              Build registration fields, save to the server, preview, then publish to

              open the public registration page. Responses appear as columns on the event

              attendee table.

            </p>

          </div>

          <span

            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${

              formPublished

                ? "bg-emerald-100 text-emerald-800"

                : "bg-amber-100 text-amber-900"

            }`}

          >

            {formPublished ? "Published" : "Draft / unpublished"}

          </span>

        </div>

        <FormToolbar

          eventId={eventId}

          onSave={persistQuestions}

          onPublish={handlePublish}

          saving={saving}

        />
        {saving && (
          <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full w-1/2 bg-blue-500 animate-pulse" />
          </div>
        )}

        {(message || error) && (

          <div

            className={`mt-4 text-sm px-4 py-3 rounded-lg ${

              error ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-800"

            }`}

          >

            {error || message}

          </div>

        )}

        {questions.length === 0 && (

          <div className="mt-6 p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50">

            <p className="font-medium text-slate-800">No form yet</p>

            <p className="text-sm text-slate-600 mt-1">

              Add your first question on the left, then save. After publish, attendees

              can register using the link below.

            </p>

          </div>

        )}

        <div className="grid md:grid-cols-2 gap-6 mt-6">

          <QuestionBuilder onAdd={handleAdd} />

          <QuestionList

            questions={questions}

            onRemove={handleRemove}

            onMove={handleMove}

          />

        </div>

        <div className="mt-8 p-5 rounded-xl bg-slate-900 text-slate-100">

          <h3 className="font-semibold text-white">Sharable registration link</h3>

          <p className="text-sm text-slate-400 mt-1">

            Works when the form is published and registration is open for this event.

          </p>

          <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">

            <code className="text-xs sm:text-sm bg-slate-800 px-3 py-2 rounded-lg break-all flex-1">

              {regUrl}

            </code>

            <button

              type="button"

              onClick={copyLink}

              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium"

            >

              <Copy size={16} />

              Copy

            </button>

            <a

              href={regUrl}

              target="_blank"

              rel="noreferrer"

              className="inline-flex items-center justify-center gap-2 border border-slate-600 text-white px-4 py-2 rounded-lg text-sm"

            >

              <ExternalLink size={16} />

              Open

            </a>

          </div>

        </div>

      </div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

    </DashboardLayout>

  );

}

export default EventFormsPage;
