# ---- Build stage ----
# Compiles the Angular/Ionic app. The production configuration uses
# baseHref "/orbitways/" (see angular.json), so the app is served same-origin
# behind nginx at https://ghassen.io/orbitways/.
FROM node:20-alpine AS build

WORKDIR /app

# The lockfile is generated locally with npm 11, whose hoisting/dedup layout the
# stock npm 10 in node:20-alpine rejects ("Missing: ... from lock file"). Pin the
# build's npm to the same major so `npm ci` validates the committed lockfile.
RUN npm install -g npm@11 --no-audit --no-fund

# Install dependencies against the lockfile for reproducible builds.
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --no-fund

# Build the web bundle. Defaults to the production configuration, which sets
# baseHref "/orbitways/" and swaps in environment.prod.ts.
COPY . .
ARG BUILD_CONFIGURATION=production
RUN npm run build -- --configuration "${BUILD_CONFIGURATION}"

# ---- Runtime stage ----
FROM nginx:alpine

# Tell the entrypoint to populate ${NGINX_LOCAL_RESOLVERS} from the pod's
# /etc/resolv.conf (it no-ops without this flag), so the resolver directive in
# the site template resolves to the in-cluster DNS at runtime.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

# Drop the stock site so the default "Welcome to nginx!" page can't leak through.
RUN rm -f /etc/nginx/conf.d/default.conf \
  && rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html || true

# Site config goes in templates/ so the entrypoint runs envsubst over it and
# fills in ${NGINX_LOCAL_RESOLVERS} (the cluster DNS) before nginx starts. It
# serves the SPA under /orbitways/ and reverse-proxies REST + STOMP/SockJS
# traffic to the orbit-ways-be Service.
COPY nginx.conf.template /etc/nginx/templates/orbitways.conf.template

# Angular's "browser" builder outputs straight into www/ (index.html at root).
COPY --from=build /app/www/ /usr/share/nginx/html/

# IPv4 health check matching the nginx /health endpoint Traefik probes.
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
