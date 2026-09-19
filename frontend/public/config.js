// Runtime configuration for the CareerHub frontend.
// In Docker/Kubernetes this file is regenerated at container startup from the
// API_BASE_URL environment variable, so the same image works on localhost,
// EC2 and Kubernetes without rebuilding React.
window.__APP_CONFIG__ = {
  API_BASE_URL: "http://localhost:8080/api/v1"
};
