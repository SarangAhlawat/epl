import { useState } from "react";

import QuestionOptions from "./QuestionOptions";

function QuestionBuilder({ onAdd }) {

  const [question, setQuestion] = useState("");

  const [fieldType, setFieldType] = useState("short_text");

  const [required, setRequired] = useState(true);

  const [options, setOptions] = useState([]);

  const handleAdd = () => {

    if (!question.trim()) return;

    onAdd({

      id: `tmp-${Date.now()}`,

      question_text: question.trim(),

      field_type: fieldType,

      is_required: required,

      options:

        fieldType === "dropdown" ||

        fieldType === "radio" ||

        fieldType === "checkbox"

          ? [...options]

          : [],

      order_index: 0

    });

    setQuestion("");

    setOptions([]);

  };

  return (

    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">

      <h3 className="font-semibold mb-4 text-slate-800">Add question</h3>

      <input

        placeholder="Question text"

        value={question}

        onChange={(e) => setQuestion(e.target.value)}

        className="border border-slate-200 p-2 w-full mb-3 rounded-lg"

      />

      <select

        value={fieldType}

        onChange={(e) => {

          setFieldType(e.target.value);

          setOptions([]);

        }}

        className="border border-slate-200 p-2 w-full mb-3 rounded-lg"

      >

        <option value="short_text">Short text</option>

        <option value="long_text">Long text</option>

        <option value="dropdown">Dropdown</option>

        <option value="radio">Multiple choice</option>

        <option value="checkbox">Checkbox</option>

        <option value="file_upload">File upload</option>

      </select>

      <label className="flex items-center gap-2 mb-3 text-sm text-slate-700">

        <input

          type="checkbox"

          checked={required}

          onChange={() => setRequired(!required)}

        />

        Required

      </label>

      <QuestionOptions

        fieldType={fieldType}

        options={options}

        onOptionsChange={setOptions}

      />

      <button

        type="button"

        onClick={handleAdd}

        className="bg-blue-600 text-white px-5 py-2 rounded-lg mt-4 w-full sm:w-auto"

      >

        Add to form

      </button>

    </div>

  );

}

export default QuestionBuilder;
