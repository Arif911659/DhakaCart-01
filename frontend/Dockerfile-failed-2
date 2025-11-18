# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with proper permissions
RUN npm ci --legacy-peer-deps

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config (if you have one)
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || echo "No nginx.conf found"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]