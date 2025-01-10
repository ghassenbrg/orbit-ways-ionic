FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy root app files
# COPY root-app/ /usr/share/nginx/html/root-app

# Copy Orbitways app files
COPY ./www /usr/share/nginx/html/orbitways

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
