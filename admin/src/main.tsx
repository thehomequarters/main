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
import Onboarding from "./pages/Onboarding";
import Verify from "./pages/Verify";

function ProtectedRoutes() {
  const { user, isAdmin, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // User is authenticated but not in /admins — show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-4">
        <div>
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Your account does not have admin permissions. Contact the system administrator.
          </p>
          <button
            onClick={signOut}
            className="px-5 py-2.5 bg-dark border border-dark-border text-gray-400 rounded-xl text-sm hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/events" element={<Events />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/invites" element={<Invites />} />
        <Route path="/onboarding" element={<Onboarding />} />
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
          <Route path="/verify" element={<Verify />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
