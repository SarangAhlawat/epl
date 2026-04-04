function FormField({

  question,
  onChange

}) {

  switch(question.field_type) {

    case "short_text":

      return (

        <input

          type="text"

          className="border p-2 w-full"

          onChange={e =>
            onChange(
              question.id,
              e.target.value
            )}

        />

      );

    case "long_text":

      return (

        <textarea

          className="border p-2 w-full"

          onChange={e =>
            onChange(
              question.id,
              e.target.value
            )}

        />

      );

    case "dropdown":

      return (

        <select

          className="border p-2 w-full"

          onChange={e =>
            onChange(
              question.id,
              e.target.value
            )}

        >

          {question.options_json?.map(
            option => (

              <option
                key={option}
              >

                {option}

              </option>

            ))}

        </select>

      );

    case "file_upload":

      return (

        <input

          type="file"

          onChange={e =>
            onChange(
              question.id,
              e.target.files[0]
            )}

        />

      );

    default:

      return null;

  }

}

export default FormField;