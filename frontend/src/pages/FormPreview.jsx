import DashboardLayout
from "../layouts/DashboardLayout";

function FormPreview() {

  return (

    <DashboardLayout>

      <h2 className="text-2xl font-bold mb-6">

        Form Preview

      </h2>

      <div className="bg-white p-6 rounded-xl shadow">

        Preview will render dynamic form here.

      </div>

    </DashboardLayout>

  );

}

export default FormPreview;