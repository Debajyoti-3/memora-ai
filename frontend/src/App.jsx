import { useState } from "react";
import { Toaster } from "sonner";
import { Landing } from "./pages/Landing";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import "./App.css";

function App() {
  // Global user state (session persistence)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("memora_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Client-side router state: 'landing' | 'auth' | 'dashboard'
  const [view, setView] = useState(() => {
    // If user is already logged in, we can direct them straight to dashboard or landing.
    // Let's start them at landing so they see the landing page, but they can click straight through.
    return "landing";
  });

  return (
    <>
      {/* Global Toast Provider */}
      <Toaster richColors closeButton position="top-right" />

      {/* Page Routing */}
      {view === "landing" && (
        <Landing user={user} setView={setView} />
      )}
      {view === "auth" && (
        <Auth setUser={setUser} setView={setView} />
      )}
      {view === "dashboard" && (
        <Dashboard user={user} setUser={setUser} setView={setView} />
      )}
    </>
  );
}

export default App;
