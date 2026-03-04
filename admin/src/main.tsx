import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./auth";
import { ToastProvider } from "./components/Toast";
import Login from "./pages/Login";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Venues from "./pages/Venues";
import Events from "./pages/Events";
import Posts from "./pages/Posts";
import Invites from "./pages/Invites";

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/events" element={<Events />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/invites" element={<Invites />} />
      </Routes>
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
