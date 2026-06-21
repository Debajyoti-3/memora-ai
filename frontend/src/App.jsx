import { useState } from "react";
import { Toaster } from "sonner";
import { Landing } from "./pages/Landing";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import "./App.css";

function App() {
  // Global user state (session persistence)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("memora_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Client-side router state: 'landing' | 'auth' | 'dashboard' | 'privacy'
  const [view, setView] = useState("landing");
  const [privacyReferrer, setPrivacyReferrer] = useState("landing");

  const navigateToPrivacy = (fromView) => {
    setPrivacyReferrer(fromView);
    setView("privacy");
  };

  return (
    <>
      {/* Global Toast Provider */}
      <Toaster richColors closeButton position="top-right" />

      {/* Page Routing */}
      {view === "landing" && (
        <Landing user={user} setView={setView} />
      )}
      {view === "auth" && (
        <Auth setUser={setUser} setView={setView} navigateToPrivacy={() => navigateToPrivacy("auth")} />
      )}
      {view === "dashboard" && (
        <Dashboard user={user} setUser={setUser} setView={setView} />
      )}
      {view === "privacy" && (
        <PrivacyPolicy setView={setView} previousView={privacyReferrer} />
      )}
    </>
  );
}

export default App;
