import DashboardLayout
from "../layouts/DashboardLayout";
import { useState } from "react";

import QuestionBuilder
from "../components/QuestionBuilder";

import QuestionList
from "../components/QuestionList";

import FormToolbar
from "../components/FormToolbar";

function FormBuilder() {

  const [questions, setQuestions] = useState([]);

  const handleAddQuestion = (question) => {
    setQuestions((prev) => [...prev, question]);
  };

  const handleSaveDraft = () => {
    localStorage.setItem("form_draft_questions", JSON.stringify(questions));
    alert("Form draft saved.");
  };

  const handlePublish = () => {
    localStorage.setItem("form_draft_questions", JSON.stringify(questions));
    alert("Form published locally. Backend publish can be added next.");
  };

  return (

    <DashboardLayout>

      <h2 className="text-2xl font-bold mb-6">

        Create Event Form

      </h2>

      <FormToolbar onSave={handleSaveDraft} onPublish={handlePublish} />

      <div className="grid md:grid-cols-2 gap-6 mt-6">

        <QuestionBuilder onAdd={handleAddQuestion} />

        <QuestionList questions={questions} />

      </div>

    </DashboardLayout>

  );

}

export default FormBuilder;