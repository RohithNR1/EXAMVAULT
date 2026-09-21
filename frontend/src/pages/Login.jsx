import { useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Button, Input, Card, ErrorState } from "../components/ui";

export default function Login() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await login(username, password);

      const access = data.access || (data.tokens && data.tokens.access);
      const refresh = data.refresh || (data.tokens && data.tokens.refresh);

      if (!access || !refresh) throw new Error("Invalid login response from server");

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);

      // Persist student profile fields for server-side access-window filtering
      if (data.role === "student") {
        localStorage.setItem("course", data.course || "");
        localStorage.setItem("semester", data.semester || "");
        localStorage.setItem("branch", data.branch || "");
        localStorage.setItem("subject", data.subject || "");
      }

      if (data.role === "teacher") nav("/teacher");
      else if (data.role === "coe") nav("/coe");
      else if (data.role === "student") nav("/student");
      else nav("/superintendent");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Brand header */}
      <header className="bg-primary-700 text-white py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold tracking-widest">EXAM-VAULT</h1>
          <p className="text-primary-200 text-sm mt-1">
            Bangalore Institute of Technology
          </p>
        </div>
      </header>

      {/* Auth card */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12 -mt-6">
        <Card className="w-full max-w-md shadow-xl">
          <Card.Header className="pb-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-800">Sign In</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Enter your credentials to continue
            </p>
          </Card.Header>
          <Card.Body>
            <form onSubmit={submit} noValidate>
              <div className="space-y-4">
                {error && (
                  <ErrorState
                    title={error}
                    description="Please check your username and password and try again."
                  />
                )}

                <Input
                  label="Username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setU(e.target.value)}
                  required
                  autoComplete="username"
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setP(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                isLoading={loading}
                disabled={loading}
                className="w-full mt-6"
                type="submit"
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>

              <p className="text-center text-sm text-neutral-600 mt-4">
                Don&apos;t have an account?{" "}
                <a
                  href="/register"
                  className="text-primary-600 font-semibold hover:text-primary-700 underline underline-offset-2"
                >
                  Sign Up
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
