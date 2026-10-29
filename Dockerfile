# Production Dockerfile for StockFlow MVP
FROM node:24-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build frontend production bundle
RUN npm run build

# Expose server port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start unified Express server
CMD ["node", "server.js"]
