import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import { decodeJwtPayload } from "../utils/jwt";

function UsersDashboard() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "volunteer" });
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const claims = decodeJwtPayload(token);
  const organizationId = claims?.organization_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organizationId) {
      setMessage("Session expired. Please log in again.");
      return;
    }

    try {
      await API.post("/users/add-user", null, {
        params: {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          organization_id: organizationId
        }
      });
      setMessage("User added successfully.");
      setForm({ name: "", email: "", password: "", role: "volunteer" });
    } catch {
      setMessage("Failed to add user.");
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Add User / Volunteer</h1>
      <p className="text-gray-600 mt-2">Create team accounts for event operations.</p>

      <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded-xl shadow max-w-2xl space-y-4">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Temporary Password"
          className="border p-2 rounded w-full"
          required
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option value="volunteer">Volunteer</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded">
          Add User
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
    </DashboardLayout>
  );
}

export default UsersDashboard;
