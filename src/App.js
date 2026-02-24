import React, { lazy, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// Context & Providers
import NoteState from "./context/notes/NoteState";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Common Components
import MinDurationSuspense from "./components/Common/MinDurationSuspense";
import Spinner from "./components/Common/Spinner";
import VoiceControl from "./components/Common/VoiceControl";
import Alert from "./components/Common/Alert";
import PageLoader from "./components/Common/PageLoader";

// Auth Components
import ProtectedRoute from "./components/Auth/ProtectedRoute";
const Signup = lazy(() => import("./components/Auth/Signup"));
const Login = lazy(() => import("./components/Auth/Login"));

// Layout
const Navbar = lazy(() => import("./components/Layout/Navbar"));
const Footer = lazy(() => import("./components/Layout/Footer"));

// Dashboard Components
const Dashboard = lazy(() => import("./components/Dashboards/Dashboard"));
const FriendsPanel = lazy(() => import("./components/Dashboards/FriendsPanel"));
const AdminDashboard = lazy(() => import("./components/Dashboards/AdminDashboard"));
const PremiumUpgrade = lazy(() => import("./components/Dashboards/PremiumUpgrade"));
const Profile = lazy(() => import("./components/Dashboards/Profile"));

// Pages
const Home = lazy(() => import("./components/Pages/Home"));
const About = lazy(() => import("./components/Pages/About"));
const Contact = lazy(() => import("./components/Pages/Contact"));
const Help = lazy(() => import("./components/Pages/Help"));
const NotFound = lazy(() => import("./components/Pages/NotFound"));

// Notes
const PublishNotes = lazy(() => import("./components/PublishNotes"));

// Layout to conditionally render Navbar, Footer, and VoiceControl
const Layout = ({ children, showAlert }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const isAdminDashboard = pathname === "/admin/dashboard";

  // Hide VoiceControl on all authenticated routes
  const isAuthenticatedRoute =
    isAdminDashboard ||
    /^\/[^/]+\/(dashboard|profile|upgrade|publishnotes|friends)$/.test(pathname) ||
    pathname === "/help";

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthenticatedRoute && <VoiceControl />}
      {!isAdminDashboard && <Navbar />}
      <Alert alert={showAlert.alert} />
      <main className="flex-grow">{children}</main>
      {!isAdminDashboard && <Footer />}
    </div>
  );
};

function App() {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type) => {
    setAlert({ msg: message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <NoteState>
      <GoogleOAuthProvider clientId="204650878291-rqldh38rgu06rgrmnru163eq5hhu9arf.apps.googleusercontent.com">
        <Router>
          <MinDurationSuspense fallback={<Spinner />} minDuration={2000}>
            <PageLoader>
              <Layout showAlert={{ alert, showAlert }}>
                <Routes>
                  <Route path="/" element={<Home showAlert={showAlert} />} />

                  {/* User-specific routes using nanoId */}
                  <Route
                    path="/:nanoId/dashboard"
                    element={<Dashboard showAlert={showAlert} />}
                  />
                  <Route
                    path="/:nanoId/profile"
                    element={<Profile showAlert={showAlert} />}
                  />
                  <Route
                    path="/:nanoId/upgrade"
                    element={<PremiumUpgrade showAlert={showAlert} />}
                  />
                  <Route
                    path="/:nanoId/publishnotes"
                    element={<PublishNotes showAlert={showAlert} />}
                  />
                  <Route
                    path="/:nanoId/friends"
                    element={
                      <ProtectedRoute>
                        <FriendsPanel showAlert={showAlert} />
                      </ProtectedRoute>
                    }
                  />

                  {/* Static route for shared note links */}
                  <Route
                    path="/notes/:uid"
                    element={<PublishNotes showAlert={showAlert} />}
                  />

                  {/* Static routes */}
                  <Route path="/about" element={<About showAlert={showAlert} />} />
                  <Route path="/contact" element={<Contact showAlert={showAlert} />} />
                  <Route path="/login" element={<Login showAlert={showAlert} />} />
                  <Route path="/signup" element={<Signup showAlert={showAlert} />} />

                  {/* Help route */}
                  <Route
                    path="/help"
                    element={
                      <ProtectedRoute>
                        <Help showAlert={showAlert} />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Admin Route */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard showAlert={showAlert} />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch-all route for 404 */}
                  <Route path="*" element={<NotFound showAlert={showAlert} />} />
                </Routes>
              </Layout>
            </PageLoader>
          </MinDurationSuspense>
        </Router>
      </GoogleOAuthProvider>
    </NoteState>
  );
}

export default App;
