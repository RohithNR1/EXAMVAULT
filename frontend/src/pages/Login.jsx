import { useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-700 via-purple-600 to-purple-500 text-white">
      
      {/* College Header */}
      <div className="text-center mb-8">
        <img
          src="/bit_logo.png"
          alt="Bangalore Institute of Technology Logo"
          className="mx-auto w-28 h-28 mb-3 drop-shadow-lg"
        />
        <h1 className="text-3xl md:text-4xl font-extrabold uppercase text-white drop-shadow-md">
          Bangalore Institute of Technology
        </h1>
        <p className="text-purple-200 mt-1 text-sm md:text-base">
          Department of Computer Science and Engineering
        </p>
      </div>

      {/* System Title */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold tracking-wide text-yellow-400 drop-shadow-lg">
          EXAM-VAULT
        </h2>
        <p className="text-purple-200 mt-1 text-sm md:text-base">
         REINVENTING EXAMINATION SECURITY THROUGH BLOCKCHAIN AND ENCRYPTION
        </p>
      </div>

      {/* Login Form */}
      <form
        onSubmit={submit}
        className="bg-white text-gray-800 w-11/12 max-w-lg rounded-2xl shadow-2xl p-8 md:p-10 backdrop-blur-lg"
      >
        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-2 rounded mb-3">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Username</label>
          <input
            className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setU(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
          <input
            className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setP(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition transform hover:scale-[1.02] disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="text-center mt-4">
          <p className="text-gray-700">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-purple-600 font-semibold hover:text-purple-700 underline"
            >
              Sign Up here
            </a>
          </p>
        </div>
       
      </form>

      {/* Footer */}
      <div className="mt-10 text-center text-purple-200 text-xs">
        © {new Date().getFullYear()} Bangalore Institute of Technology | Developed by Department of CSE
      </div>
    </div>
  );
}
