import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import ScrollProgressBar from "./components/ScrollProgressBar.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import VerifyOtp from "./pages/auth/VerifyOtp.jsx";
import SetPassword from "./pages/auth/SetPassword.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import LiveGlobalScan from "./pages/LiveGlobalScan.jsx";
import SimulationArchive from "./pages/SimulationArchive.jsx";
import Predict from "./pages/Predict.jsx";
import Analytics from "./pages/Analytics.jsx";
import Historical from "./pages/Historical.jsx";
import MLModel from "./pages/MLModel.jsx";
import MapView from "./pages/MapView.jsx";
import Alerts from "./pages/Alerts.jsx";
import Locations from "./pages/Locations.jsx";
import About from "./pages/About.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import Contact from "./pages/Contact.jsx";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <ScrollProgressBar />
      <Routes>
        {/* Public landing page - the site's main entry point, no login required */}
        <Route path="/" element={<Home />} />

        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public content pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected app routes - require login */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/monitoring" element={<LiveGlobalScan />} />
                  <Route path="/simulation-archive" element={<SimulationArchive />} />
                  <Route path="/predict" element={<Predict />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/historical" element={<Historical />} />
                  <Route path="/model" element={<MLModel />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
