import DashboardLayout
from "../layouts/DashboardLayout";

import QuestionBuilder
from "../components/QuestionBuilder";

import QuestionList
from "../components/QuestionList";

import FormToolbar
from "../components/FormToolbar";

function FormBuilder() {

  return (

    <DashboardLayout>

      <h2 className="text-2xl font-bold mb-6">

        Create Event Form

      </h2>

      <FormToolbar />

      <div className="grid md:grid-cols-2 gap-6 mt-6">

        <QuestionBuilder />

        <QuestionList />

      </div>

    </DashboardLayout>

  );

}

export default FormBuilder;