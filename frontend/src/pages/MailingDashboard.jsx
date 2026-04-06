import DashboardLayout from "../layouts/DashboardLayout";

function MailingDashboard() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Mailing Center</h1>
      <p className="text-gray-600 mt-2">Prepare and send QR passes and certificates to attendees.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold">QR Pass Mailing</h2>
          <p className="mt-2 text-gray-600">
            Upload pass template, map attendee fields, and queue mails.
          </p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Start Pass Workflow</button>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold">Certificate Mailing</h2>
          <p className="mt-2 text-gray-600">
            Upload certificate template and send personalized completion certificates.
          </p>
          <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Start Certificate Workflow</button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold">Delivery Log</h2>
        <p className="text-gray-600 mt-2">Mail delivery tracking UI will appear here.</p>
      </div>
    </DashboardLayout>
  );
}

export default MailingDashboard;
