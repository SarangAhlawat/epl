import MainLayout from "../layouts/MainLayout";

const STEPS = [
  {
    title: "Create Organization",
    desc: "Sign up as an admin and create your organization workspace."
  },
  {
    title: "Create Event",
    desc: "Add event details, branding assets, and choose public/private visibility."
  },
  {
    title: "Build Form",
    desc: "Design your registration form with custom questions and publish it."
  },
  {
    title: "Import Attendees",
    desc: "Upload Excel and map columns to prepare passes and check-in data."
  },
  {
    title: "Mail & Check-in",
    desc: "Send passes/certificates and run QR/manual check-in on event day."
  }
];

function HowToUse() {
  return (
    <MainLayout>
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-blue-900 text-center">How to Use GetEvents</h1>
        <p className="text-center text-gray-600 mt-3">
          A complete organizer workflow from setup to check-in.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {STEPS.map((step, idx) => (
            <div key={step.title} className="bg-white rounded-xl shadow p-6 border border-blue-50">
              <p className="text-sm text-blue-700 font-semibold">Step {idx + 1}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">{step.title}</h2>
              <p className="mt-2 text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}

export default HowToUse;
