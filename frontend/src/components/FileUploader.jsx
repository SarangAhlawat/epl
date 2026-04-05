function FileUploader({

  label,
  onChange

}) {

  return (

    <div className="mb-4">

      <label className="block font-medium mb-2">

        {label}

      </label>

      <input

        type="file"

        onChange={(e) =>

          onChange(
            e.target.files[0]
          )

        }

        className="border p-2 w-full rounded"

      />

    </div>

  );

}

export default FileUploader;