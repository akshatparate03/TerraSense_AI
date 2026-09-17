import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import VerifyOtp from "./pages/auth/VerifyOtp.jsx";
import SetPassword from "./pages/auth/SetPassword.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import LiveMonitoring from "./pages/LiveMonitoring.jsx";
import Predict from "./pages/Predict.jsx";
import Analytics from "./pages/Analytics.jsx";
import Historical from "./pages/Historical.jsx";
import MLModel from "./pages/MLModel.jsx";
import MapView from "./pages/MapView.jsx";
import Alerts from "./pages/Alerts.jsx";
import Locations from "./pages/Locations.jsx";
import About from "./pages/About.jsx";

export default function App() {
  return (
    <>
      <ScrollToTop />
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

        {/* Protected app routes - require login */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/monitoring" element={<LiveMonitoring />} />
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
