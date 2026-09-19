# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Dependencies first so the layer is cached while only source changes.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine
RUN apk add --no-cache curl

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /usr/local/bin/careerhub-entrypoint.sh
RUN chmod +x /usr/local/bin/careerhub-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/careerhub-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
