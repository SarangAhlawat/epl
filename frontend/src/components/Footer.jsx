function Footer() {

  return (

    <footer className="bg-slate-950 text-white py-14 mt-20">

      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold">
              GetEvents
            </h3>
            <p className="mt-3 text-slate-300">
              Premium event operations from registration to check-in.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Platform</h4>
            <ul className="mt-3 space-y-2 text-slate-300 text-sm">
              <li>Public Events</li>
              <li>Form Builder</li>
              <li>Excel Import</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Operations</h4>
            <ul className="mt-3 space-y-2 text-slate-300 text-sm">
              <li>Mailing Workflows</li>
              <li>QR Check-in</li>
              <li>Attendance Analytics</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Team Roles</h4>
            <ul className="mt-3 space-y-2 text-slate-300 text-sm">
              <li>Admin</li>
              <li>Organizer</li>
              <li>Volunteer</li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-sm text-slate-400 border-t border-slate-800 pt-6 text-center">

          © 2026 GetEvents. All rights reserved.

        </p>

      </div>

    </footer>

  );

}

export default Footer;