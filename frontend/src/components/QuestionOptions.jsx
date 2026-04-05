import { useState }

from "react";

function QuestionOptions({

  fieldType

}) {

  const [options,
    setOptions] =
      useState([]);

  const [value,
    setValue] =
      useState("");

  if (

    fieldType !== "dropdown"
    && fieldType !== "radio"
    && fieldType !== "checkbox"

  ) return null;

  const addOption = () => {

    setOptions([

      ...options,

      value

    ]);

    setValue("");

  };

  return (

    <div>

      <h4 className="font-medium mb-2">

        Options

      </h4>

      <div className="flex gap-2">

        <input

          placeholder="Add Option"

          value={value}

          onChange={e =>
            setValue(
              e.target.value
            )}

          className="border p-2 flex-1 rounded"

        />

        <button

          onClick={addOption}

          className="bg-gray-200 px-3 rounded"

        >

          Add

        </button>

      </div>

      <ul className="mt-2">

        {options.map(opt => (

          <li key={opt}>

            {opt}

          </li>

        ))}

      </ul>

    </div>

  );

}

export default QuestionOptions;