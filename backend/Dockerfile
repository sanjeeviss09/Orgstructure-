# Use an official Node runtime as a parent image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine AS production

# Set working directory
WORKDIR /usr/src/app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
# If you have static data needed at runtime, copy it too
COPY --from=builder /usr/src/app/src/data ./dist/data

# Expose the port the app runs on
EXPOSE 3001

# Add a health check instruction for ECS/EKS
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Command to run the application
CMD ["node", "dist/server.js"]
