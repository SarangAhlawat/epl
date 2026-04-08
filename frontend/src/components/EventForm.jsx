import { useState }
from "react";

import API
from "../services/api";

import FileUploader
from "./FileUploader";

import { decodeJwtPayload }
from "../utils/jwt";

function EventForm() {

  const [form,
    setForm] = useState({

    title: "",
    description: "",
    venue: "",
    date: "",
    is_public: true,
    theme_color: "#2563EB"

  });

  const [logo,
    setLogo] = useState(null);

  const [passTemplate,
    setPassTemplate] =
      useState(null);

  const [certificateTemplate,
    setCertificateTemplate] =
      useState(null);

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm({

      ...form,

      [name]:
        name === "is_public"
          ? value === "true"
          : value

    });

  };

  const handleSubmit =
  async () => {

    const token = localStorage.getItem("token");
    const payload = decodeJwtPayload(token);

    const organizationId = payload?.organization_id;
    const createdBy = payload?.user_id;

    if (!organizationId || !createdBy) {
      alert("Missing account details. Please log in again.");
      return;
    }

    const data = new FormData();

    Object.keys(form)
      .forEach(key => {

        data.append(
          key,
          form[key]
        );

      });

    data.append("logo", logo);

    data.append(
      "pass_template",
      passTemplate
    );

    data.append(
      "certificate_template",
      certificateTemplate
    );

    data.append(
      "organization_id",
      organizationId
    );

    data.append(
      "created_by",
      createdBy
    );

    await API.post(

      "/events/create",

      data

    );

    alert("Event Created!");

  };

  return (

    <div className="bg-white p-6 rounded-xl shadow">

      <h2 className="text-xl font-bold mb-6">

        Create Event

      </h2>

      <input

        name="title"

        placeholder="Event Title"

        onChange={handleChange}

        className="border p-2 w-full mb-3 rounded"

      />

      <textarea

        name="description"

        placeholder="Description"

        onChange={handleChange}

        className="border p-2 w-full mb-3 rounded"

      />

      <input

        name="venue"

        placeholder="Venue"

        onChange={handleChange}

        className="border p-2 w-full mb-3 rounded"

      />

      <input

        type="datetime-local"

        name="date"

        onChange={handleChange}

        className="border p-2 w-full mb-3 rounded"

      />

      <select

        name="is_public"

        onChange={handleChange}

        className="border p-2 w-full mb-3 rounded"

      >

        <option value={true}>

          Public Event (List on this platform along with sharable link)

        </option>

        <option value={false}>

          Private Event (Share only through link)

        </option>

      </select>

      <FileUploader

        label="Upload Event Cover Image"

        onChange={setLogo}

      />

      {/* <FileUploader

        label="Upload Pass Template"

        onChange={setPassTemplate}

      />

      <FileUploader

        label="Upload Certificate Template"

        onChange={setCertificateTemplate}

      /> */}

      <button

        onClick={handleSubmit}

        className="bg-blue-600 text-white px-6 py-2 rounded mt-4"

      >

        Create Event

      </button>

    </div>

  );

}

export default EventForm;