import { useEffect, useState }
from "react";

import { useParams }
from "react-router-dom";

import API from "../services/api";

import DynamicForm
from "../components/DynamicForm";

function EventDetail() {

  const { eventId } = useParams();

  const [event, setEvent] =
    useState(null);

  const [questions,
    setQuestions] = useState([]);

  useEffect(() => {

    API.get(
      `/events/${eventId}`
    ).then(res => {

      setEvent(res.data);

    });

    API.get(
      `/form/get-form/${eventId}`
    ).then(res => {

      setQuestions(res.data);

    });

  }, [eventId]);

  if (!event) return <p>Loading...</p>;

  return (

    <div className="p-8">

      <img

        src={event.logo_url}

        className="w-full h-60 object-cover rounded"

      />

      <h1 className="text-3xl font-bold mt-4">

        {event.title}

      </h1>

      <p className="text-gray-600">

        {event.description}

      </p>

      <DynamicForm

        eventId={eventId}

        questions={questions}

      />

    </div>

  );
}

export default EventDetail;