# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create reference materials directory and set permissions
RUN mkdir -p reference-materials && chown -R node:node /app

# Set environment variables
ENV NODE_ENV=production

# Use non-root user for security
USER node

# Expose port for webhook (if used)
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
