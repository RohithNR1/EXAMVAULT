import { useState } from "react";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Button, Input, Card, ErrorState } from "../components/ui";
import { COURSES, SEMESTERS, BRANCHES, SUBJECTS, ROLES } from "../data/selectOptions";
import { useToast } from "../contexts/ToastContext";

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
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();
  const toast = useToast();

  const set = (k, v) => setForm({ ...form, [k]: v });

  // Clear per-field errors whenever the user corrects the field
  const clearFieldError = (k) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });

  const validate = () => {
    const err = {};
    if (!form.username) err.username = "Username is required";
    if (!form.email) err.email = "Email is required";
    if (!form.password) err.password = "Password is required";
    if (form.password && form.password.length < 6)
      err.password = "Password must be at least 6 characters";
    if (!form.first_name) err.first_name = "First name is required";
    if (!form.last_name) err.last_name = "Last name is required";
    return err;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const err = validate();
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await register(form);
      nav("/login");
    } catch (error) {
      console.error(error.response?.data);
      const msg =
        error.response?.data?.detail ||
        Object.entries(error.response?.data ?? {}).map(
          ([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`
        ).join("; ") ||
        "Registration failed";
      const display = typeof msg === "string" ? msg : "Registration failed";
      setSubmitError(display);
      toast("error", null, display);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary-700 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold tracking-widest">EXAM-VAULT</h1>
          <p className="text-primary-200 text-sm mt-1">Create your account</p>
        </div>
      </header>

      {/* Form card */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <Card className="w-full max-w-2xl shadow-xl">
          <Card.Header className="pb-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-800">Register</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Fill in your details to create an account
            </p>
          </Card.Header>
          <Card.Body>
            {submitError && (
              <ErrorState
                title="Registration failed"
                description={submitError}
              />
            )}

            <form onSubmit={submit} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Username *"
                  type="text"
                  placeholder="jdoe"
                  value={form.username}
                  onChange={(e) => { set("username", e.target.value); clearFieldError("username"); }}
                  error={errors.username}
                  required
                  autoComplete="username"
                />
                <Input
                  label="Email *"
                  type="email"
                  placeholder="jdoe@example.com"
                  value={form.email}
                  onChange={(e) => { set("email", e.target.value); clearFieldError("email"); }}
                  error={errors.email}
                  required
                  autoComplete="email"
                />
                <Input
                  label="Password *"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => { set("password", e.target.value); clearFieldError("password"); }}
                  error={errors.password}
                  required
                  autoComplete="new-password"
                />
                <Input
                  label="First Name *"
                  type="text"
                  placeholder="John"
                  value={form.first_name}
                  onChange={(e) => { set("first_name", e.target.value); clearFieldError("first_name"); }}
                  error={errors.first_name}
                  required
                />
                <Input
                  label="Last Name *"
                  type="text"
                  placeholder="Doe"
                  value={form.last_name}
                  onChange={(e) => { set("last_name", e.target.value); clearFieldError("last_name"); }}
                  error={errors.last_name}
                  required
                />
                <label className="block">
                  <span className="text-sm font-medium text-neutral-700">Role *</span>
                  <select
                    className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft text-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white py-2 px-3"
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                    required
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>

                {/* Conditionally show academic fields only for student role */}
                {form.role === "student" && (
                  <>
                    <label className="block">
                      <span className="text-sm font-medium text-neutral-700">Course</span>
                      <select
                        className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft text-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white py-2 px-3"
                        value={form.course}
                        onChange={(e) => set("course", e.target.value)}
                      >
                        {COURSES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-neutral-700">Semester</span>
                      <select
                        className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft text-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white py-2 px-3"
                        value={form.semester}
                        onChange={(e) => set("semester", e.target.value)}
                      >
                        {SEMESTERS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-neutral-700">Branch</span>
                      <select
                        className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft text-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white py-2 px-3"
                        value={form.branch}
                        onChange={(e) => set("branch", e.target.value)}
                      >
                        {BRANCHES.map((b) => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-neutral-700">Subject</span>
                      <select
                        className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft text-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white py-2 px-3"
                        value={form.subject}
                        onChange={(e) => set("subject", e.target.value)}
                      >
                        {SUBJECTS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={submitting}
                  disabled={submitting}
                  className="flex-1"
                  type="submit"
                >
                  {submitting ? "Creating account…" : "Create Account"}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => nav("/login")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>

              <p className="text-center text-sm text-neutral-500 mt-4">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-primary-600 font-semibold hover:text-primary-700 underline underline-offset-2"
                >
                  Sign In
                </a>
              </p>
            </form>
          </Card.Body>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Bangalore Institute of Technology
      </footer>
    </div>
  );
}
