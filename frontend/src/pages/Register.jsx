import { useState } from "react";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    course: "",
    semester: "",
    branch: "",
    subject: "",
    role: "teacher",
  });

  const [errors, setErrors] = useState({});
  const nav = useNavigate();
  const set = (k, v) => setForm({ ...form, [k]: v });

  // Simple client-side validation
  const validate = () => {
    const err = {};
    if (!form.username) err.username = "Username is required";
    if (!form.email) err.email = "Email is required";
    if (!form.password) err.password = "Password is required";
    if (!form.first_name) err.first_name = "First name is required";
    if (!form.last_name) err.last_name = "Last name is required";
    return err;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    setErrors({});
    try {
      await register(form);
      nav("/login");
    } catch (error) {
      console.error(error.response?.data);
      alert("Register failed: " + JSON.stringify(error.response?.data));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-lg grid grid-cols-2 gap-3">
        <h1 className="col-span-2 text-2xl font-semibold mb-2">Register</h1>

        <input
          className="border p-2"
          placeholder="Username"
          value={form.username}
          onChange={(e) => set("username", e.target.value)}
        />
        {errors.username && <span className="text-red-500">{errors.username}</span>}

        <input
          className="border p-2"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        {errors.email && <span className="text-red-500">{errors.email}</span>}

        <input
          className="border p-2"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        {errors.password && <span className="text-red-500">{errors.password}</span>}

        <input
          className="border p-2"
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => set("first_name", e.target.value)}
        />
        {errors.first_name && <span className="text-red-500">{errors.first_name}</span>}

        <input
          className="border p-2"
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => set("last_name", e.target.value)}
        />
        {errors.last_name && <span className="text-red-500">{errors.last_name}</span>}

        {/* Course */}
        <select
          className="border p-2"
          value={form.course}
          onChange={(e) => set("course", e.target.value)}
        >
          <option value="">Select Course</option>
          <option value="B.E.">B.E.</option>
          <option value="M.E.">M.E.</option>
        </select>

        {/* Semester */}
        <select
          className="border p-2"
          value={form.semester}
          onChange={(e) => set("semester", e.target.value)}
        >
          <option value="">Select Semester</option>
          {["I", "II", "III", "IV", "V", "VI", "VII", "VIII"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Branch */}
        <select
          className="border p-2"
          value={form.branch}
          onChange={(e) => set("branch", e.target.value)}
        >
          <option value="">Select Branch</option>
          {["CSE", "IT", "ECE", "EEE", "MECH", "BioTech"].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Subject */}
        <select
          className="border p-2"
          value={form.subject}
          onChange={(e) => set("subject", e.target.value)}
        >
          <option value="">Select Subject</option>
          {[
            "Internet of Things",
            "Parallel Computing",
            "Cryptography",
            "Big Data Analytics",
            "MACHINE LEARNING",
          ].map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        {/* Role */}
        <select
          className="border p-2"
          value={form.role}
          onChange={(e) => set("role", e.target.value)}
        >
          <option value="teacher">Teacher</option>
          <option value="coe">COE</option>
          <option value="student">Student</option>
          <option value="superintendent">Superintendent</option>
        </select>

        <button className="col-span-2 bg-black text-white py-2 rounded">
          Create account
        </button>
      </form>
    </div>
  );
}
