#!/bin/sh
# Writes the runtime configuration that the browser reads before the React bundle
# starts. This is what lets one image run against localhost, an EC2 instance or a
# Kubernetes service without rebuilding the frontend.
set -eu

API_BASE_URL="${API_BASE_URL:-/api/v1}"

cat > /usr/share/nginx/html/config.js <<CONFIG
window.__APP_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}"
};
CONFIG

echo "CareerHub frontend configured with API_BASE_URL=${API_BASE_URL}"

exec "$@"
