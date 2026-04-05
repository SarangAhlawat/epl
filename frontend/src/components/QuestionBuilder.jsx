import { useState }

from "react";

import QuestionOptions
from "./QuestionOptions";

function QuestionBuilder({

  onAdd

}) {

  const [question,
    setQuestion] = useState("");

  const [fieldType,
    setFieldType] =
      useState("short_text");

  const [required,
    setRequired] =
      useState(true);

  const handleAdd = () => {

    onAdd({

      id: Date.now(),

      question_text:
        question,

      field_type:
        fieldType,

      is_required:
        required,

      options: []

    });

    setQuestion("");

  };

  return (

    <div className="bg-white p-5 rounded-xl shadow">

      <h3 className="font-semibold mb-4">

        Add Question

      </h3>

      <input

        placeholder="Question Text"

        value={question}

        onChange={e =>
          setQuestion(
            e.target.value
          )}

        className="border p-2 w-full mb-3 rounded"

      />

      <select

        value={fieldType}

        onChange={e =>
          setFieldType(
            e.target.value
          )}

        className="border p-2 w-full mb-3 rounded"

      >

        <option value="short_text">

          Short Text

        </option>

        <option value="long_text">

          Long Text

        </option>

        <option value="dropdown">

          Dropdown

        </option>

        <option value="radio">

          Multiple Choice

        </option>

        <option value="checkbox">

          Checkbox

        </option>

        <option value="file_upload">

          File Upload

        </option>

      </select>

      <label className="flex items-center gap-2 mb-3">

        <input

          type="checkbox"

          checked={required}

          onChange={() =>
            setRequired(!required)
          }

        />

        Required

      </label>

      <QuestionOptions
        fieldType={fieldType}
      />

      <button

        onClick={handleAdd}

        className="bg-blue-600 text-white px-5 py-2 rounded mt-4"

      >

        Add Question

      </button>

    </div>

  );

}

export default QuestionBuilder;