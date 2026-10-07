# Production Dockerfile for Mizoram VC Directory System
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose backend port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start sync backend server
CMD ["node", "backend/server.js"]
