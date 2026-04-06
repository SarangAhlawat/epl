import { useState } from "react";

function QuestionOptions({ fieldType, options, onOptionsChange }) {

  const [value, setValue] = useState("");

  if (

    fieldType !== "dropdown" &&

    fieldType !== "radio" &&

    fieldType !== "checkbox"

  ) {

    return null;

  }

  const addOption = () => {

    const v = value.trim();

    if (!v) return;

    onOptionsChange([...options, v]);

    setValue("");

  };

  const removeAt = (i) => {

    onOptionsChange(options.filter((_, j) => j !== i));

  };

  return (

    <div className="border-t border-slate-100 pt-3 mt-1">

      <h4 className="font-medium mb-2 text-sm text-slate-700">Answer options</h4>

      <div className="flex gap-2">

        <input

          placeholder="Add option"

          value={value}

          onChange={(e) => setValue(e.target.value)}

          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}

          className="border border-slate-200 p-2 flex-1 rounded-lg text-sm"

        />

        <button

          type="button"

          onClick={addOption}

          className="bg-slate-100 px-3 rounded-lg text-sm font-medium"

        >

          Add

        </button>

      </div>

      <ul className="mt-2 space-y-1">

        {options.map((opt, i) => (

          <li

            key={`${opt}-${i}`}

            className="flex justify-between items-center text-sm bg-slate-50 px-2 py-1 rounded"

          >

            <span>{opt}</span>

            <button

              type="button"

              className="text-red-600 text-xs"

              onClick={() => removeAt(i)}

            >

              Remove

            </button>

          </li>

        ))}

      </ul>

    </div>

  );

}

export default QuestionOptions;
