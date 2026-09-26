import axios from "axios";

// In production (Netlify), set VITE_API_BASE_URL to the Render backend URL,
// e.g. https://terrasenseai-backend.onrender.com/api
// In local dev, Vite's proxy (vite.config.js) forwards /api to localhost:8000,
// so the relative path works without any env var.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({ baseURL: BASE_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("terrasense_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    // A 401 from the auth endpoints themselves (bad password, invalid/expired
    // Google token, etc.) is just a failed login attempt -- the calling page
    // should show that error inline. Only a 401 from an already-authenticated
    // request means the session actually expired and should force a redirect.
    const isAuthEndpoint = url.startsWith("/auth/");
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("terrasense_token");
      localStorage.removeItem("terrasense_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authRegister = (name, email, accountType = "individual") =>
  api.post("/auth/register", { name, email, account_type: accountType }).then((r) => r.data);
export const authVerifyOtp = (email, otp) =>
  api.post("/auth/verify-otp", { email, otp }).then((r) => r.data);
export const authResendOtp = (email) =>
  api.post("/auth/resend-otp", { email }).then((r) => r.data);
export const authSetPassword = (email, password, confirm_password) =>
  api
    .post("/auth/set-password", { email, password, confirm_password })
    .then((r) => r.data);
export const authLogin = (email, password) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);
export const authGoogleLogin = (id_token) =>
  api.post("/auth/google", { id_token }).then((r) => r.data);
export const authForgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data);
export const authResetPassword = (
  token,
  email,
  new_password,
  confirm_password,
) =>
  api
    .post("/auth/reset-password", {
      token,
      email,
      new_password,
      confirm_password,
    })
    .then((r) => r.data);
export const authMe = () => api.get("/auth/me").then((r) => r.data);
export const authLogout = () => api.post("/auth/logout").then((r) => r.data);
export const authPasswordRules = () =>
  api.get("/auth/password-rules").then((r) => r.data);

// ---------------------------------------------------------------------------
// Dashboard / analytics / dataset
// ---------------------------------------------------------------------------
export const getDashboardSummary = () =>
  api.get("/dashboard/summary").then((r) => r.data);
export const getAnalyticsOverview = () =>
  api.get("/analytics/overview").then((r) => r.data);
export const getRiskDistribution = () =>
  api.get("/analytics/risk-distribution").then((r) => r.data);
export const getLocationSummary = () =>
  api.get("/analytics/location-summary").then((r) => r.data);
export const getAnalyticsTimeline = (days = 30) =>
  api.get("/analytics/timeline", { params: { days } }).then((r) => r.data);
export const getAlertsAnalytics = () =>
  api.get("/analytics/alerts").then((r) => r.data);

export const getDatasetAnalytics = () =>
  api.get("/dataset/analytics").then((r) => r.data);
export const getDatasetHistorical = (params = {}) =>
  api.get("/dataset/historical", { params }).then((r) => r.data);
export const getDatasetLocations = (limit = 300) =>
  api.get("/dataset/locations", { params: { limit } }).then((r) => r.data);

// ---------------------------------------------------------------------------
// Locations (DB CRUD)
// ---------------------------------------------------------------------------
export const getLocations = () => api.get("/locations").then((r) => r.data);
export const getLocation = (id) =>
  api.get(`/locations/${id}`).then((r) => r.data);
export const createLocation = (payload) =>
  api.post("/locations", payload).then((r) => r.data);
export const updateLocation = (id, payload) =>
  api.put(`/locations/${id}`, payload).then((r) => r.data);
export const deleteLocation = (id) =>
  api.delete(`/locations/${id}`).then((r) => r.data);

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------
export const postPredict = (payload) =>
  api.post("/predictions", payload).then((r) => r.data);
export const postPredictLocation = (payload) =>
  api.post("/predictions/location", payload).then((r) => r.data);
export const getLocationFeatures = (latitude, longitude, radius_km = 5) =>
  api
    .get("/location/features", { params: { latitude, longitude, radius_km } })
    .then((r) => r.data);
export const getPredictions = (params = {}) =>
  api.get("/predictions", { params }).then((r) => r.data);
export const getPrediction = (id) =>
  api.get(`/predictions/${id}`).then((r) => r.data);
export const getLatestPredictions = (limit = 10) =>
  api.get("/predictions/latest", { params: { limit } }).then((r) => r.data);
export const getHighRiskPredictions = () =>
  api.get("/predictions/high-risk").then((r) => r.data);

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
export const getAlerts = (params = {}) =>
  api.get("/alerts", { params }).then((r) => r.data);
export const getActiveAlerts = () =>
  api.get("/alerts/active").then((r) => r.data);
export const getAlertHistory = () =>
  api.get("/alerts/history").then((r) => r.data);
export const updateAlertStatus = (id, status) =>
  api.patch(`/alerts/${id}/status`, { status }).then((r) => r.data);

// ---------------------------------------------------------------------------
// Email alert monitoring (subscriptions)
// ---------------------------------------------------------------------------
export const getMonitoringStatus = () =>
  api.get("/monitoring/status").then((r) => r.data);
export const startMonitoring = (payload) =>
  api.post("/monitoring/start", payload).then((r) => r.data);
export const stopMonitoring = (subscription_id) =>
  api.post("/monitoring/stop", { subscription_id }).then((r) => r.data);
export const sendTestAlert = (subscription_id) =>
  api.post("/alerts/test", { subscription_id }).then((r) => r.data);
export const getEmailAlertHistory = () =>
  api.get("/alerts/email-history").then((r) => r.data);

// ---------------------------------------------------------------------------
// Landslide events
// ---------------------------------------------------------------------------
export const getLandslideEvents = (params = {}) =>
  api.get("/landslide-events", { params }).then((r) => r.data);

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
export const getModelInfo = () => api.get("/model/info").then((r) => r.data);
export const getModelMetrics = () =>
  api.get("/model/metrics").then((r) => r.data);
export const getModelFeatures = () =>
  api.get("/model/features").then((r) => r.data);
export const getConfusionMatrix = () =>
  api.get("/model/confusion-matrix").then((r) => r.data);
export const getRocCurve = () =>
  api.get("/model/roc-curve").then((r) => r.data);
export const getPrecisionRecallCurve = () =>
  api.get("/model/precision-recall-curve").then((r) => r.data);
export const getCorrelationMatrix = () =>
  api.get("/dataset/correlation-matrix").then((r) => r.data);
export const getModels = () => api.get("/models").then((r) => r.data);
export const getLatestModel = () =>
  api.get("/models/latest").then((r) => r.data);

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
export const simulationStart = (speed = 1) =>
  api
    .post("/simulation/start", null, { params: { speed } })
    .then((r) => r.data);
export const simulationPause = () =>
  api.post("/simulation/pause").then((r) => r.data);
export const simulationResume = () =>
  api.post("/simulation/resume").then((r) => r.data);
export const simulationStop = () =>
  api.post("/simulation/stop").then((r) => r.data);
export const simulationReset = () =>
  api.post("/simulation/reset").then((r) => r.data);
export const simulationSpeed = (speed) =>
  api
    .post("/simulation/speed", null, { params: { speed } })
    .then((r) => r.data);
export const simulationStatus = () =>
  api.get("/simulation/status").then((r) => r.data);
export const simulationFullHistory = () =>
  api.get("/simulation/full-history").then((r) => r.data);

export const wsMonitoringUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) return import.meta.env.VITE_WS_BASE_URL;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/monitoring`;
};

// ---------------------------------------------------------------------------
// Live Global Scan (real, named-location risk checks -- replaces the old
// simulation-backed "Live Monitoring" page)
// ---------------------------------------------------------------------------
export const getScanWatchlist = () =>
  api.get("/scan/locations").then((r) => r.data);
export const runGlobalScan = () =>
  api.post("/scan/run").then((r) => r.data);
export const getLatestScanResults = () =>
  api.get("/scan/latest").then((r) => r.data);
export const wsLiveScanUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL.replace(/\/ws\/monitoring$/, "/ws/live-scan");
  }
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/live-scan`;
};

export default api;

export const submitContactForm = (payload) =>
  api.post("/contact", payload).then((r) => r.data);
