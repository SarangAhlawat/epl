function QuestionList({

  questions = []

}) {

  return (

    <div className="bg-white p-5 rounded-xl shadow">

      <h3 className="font-semibold mb-4">

        Form Questions

      </h3>

      {questions.map(q => (

        <div

          key={q.id}

          className="border p-3 rounded mb-2"

        >

          <p className="font-medium">

            {q.question_text}

          </p>

          <p className="text-sm text-gray-500">

            {q.field_type}

          </p>

        </div>

      ))}

    </div>

  );

}

export default QuestionList;