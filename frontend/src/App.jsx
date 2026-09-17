import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Teacher from "./pages/Teacher";
import COE from "./pages/COE";
import Superintendent from "./pages/Superintendent";
import Student from "./pages/Student";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />

        <Route path="/teacher" element={<ProtectedRoute allowedRole="teacher"><Teacher/></ProtectedRoute>} />
        <Route path="/coe" element={<ProtectedRoute allowedRole="coe"><COE/></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute allowedRole="student"><Student/></ProtectedRoute>} />
        <Route path="/superintendent" element={<ProtectedRoute allowedRole="superintendent"><Superintendent/></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
