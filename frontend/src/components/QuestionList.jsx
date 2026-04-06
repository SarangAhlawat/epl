import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

function QuestionList({

  questions = [],

  onRemove,

  onMove

}) {

  return (

    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">

      <h3 className="font-semibold mb-4 text-slate-800">

        Form questions

      </h3>

      {questions.length === 0 && (

        <p className="text-sm text-slate-500">No questions yet. Add fields on the left.</p>

      )}

      {questions.map((q, idx) => (

        <div

          key={q.id}

          className="border border-slate-200 p-3 rounded-lg mb-2 flex gap-3 items-start bg-slate-50/50"

        >

          <div className="flex flex-col gap-1 shrink-0">

            <button

              type="button"

              title="Move up"

              disabled={idx === 0}

              onClick={() => onMove?.(idx, -1)}

              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"

            >

              <ChevronUp size={18} />

            </button>

            <button

              type="button"

              title="Move down"

              disabled={idx === questions.length - 1}

              onClick={() => onMove?.(idx, 1)}

              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"

            >

              <ChevronDown size={18} />

            </button>

          </div>

          <div className="flex-1 min-w-0">

            <p className="font-medium text-slate-900">{q.question_text}</p>

            <p className="text-sm text-slate-500 capitalize">

              {q.field_type.replace(/_/g, " ")}

              {q.is_required ? " · Required" : " · Optional"}

            </p>

            {Array.isArray(q.options) && q.options.length > 0 && (

              <p className="text-xs text-slate-600 mt-1">

                Options: {q.options.join(", ")}

              </p>

            )}

          </div>

          <button

            type="button"

            title="Remove"

            onClick={() => onRemove?.(q.id)}

            className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0"

          >

            <Trash2 size={18} />

          </button>

        </div>

      ))}

    </div>

  );

}

export default QuestionList;
