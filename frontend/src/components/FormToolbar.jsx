import { Link } from "react-router-dom";

import { Eye, Save, Send } from "lucide-react";

function FormToolbar({ eventId, onSave, onPublish, saving }) {

  const previewTo = `/dashboard/event/${eventId}/forms/preview`;

  const backTo = `/dashboard/event/${eventId}`;

  return (

    <div className="flex flex-wrap items-center gap-3">

      <Link

        to={backTo}

        className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2"

      >

        ← Event hub

      </Link>

      <button

        type="button"

        disabled={saving}

        onClick={onSave}

        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"

      >

        <Save size={16} />

        Save form

      </button>

      <Link to={previewTo}>

        <span className="inline-flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">

          <Eye size={16} />

          Preview

        </span>

      </Link>

      <button

        type="button"

        disabled={saving}

        onClick={onPublish}

        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"

      >

        <Send size={16} />

        Publish

      </button>

    </div>

  );

}

export default FormToolbar;
