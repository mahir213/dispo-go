# Build arguments for cross-platform builds
ARG BUILDPLATFORM=linux/amd64

# Use a minimal Node.js base image for the build stage (native platform for speed)
FROM --platform=$BUILDPLATFORM node:20.19-alpine AS build

# Set the working directory
WORKDIR /app

# Copy only package manifests for dependency installation
COPY package*.json ./
COPY prisma ./prisma

# Set dummy environment variables for build time
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public" \
    BETTER_AUTH_SECRET="dummy-secret-for-build-only-minimum-32-chars" \
    BETTER_AUTH_URL="http://localhost:3000" \
    RESEND_API_KEY="dummy" \
    EMAIL_FROM="dummy@example.com" \
    CRON_SECRET="dummy" \
    NEXT_PUBLIC_APP_URL="https://dispo-go.polodev.net"

# Install dependencies with optimizations for ARM64 builds
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

# Copy application source code
COPY . .

# Add arm64 binary target for Prisma Client and generate
RUN sed -i 's|provider = "prisma-client-js"|provider = "prisma-client-js"\n  binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]|' prisma/schema.prisma && \
    npx prisma generate

# Build the application
RUN npm run build

# Use a minimal runtime Node.js base image for production
FROM node:20.19-alpine AS runtime

# Set the working directory
WORKDIR /app

# Copy only production dependencies
COPY package*.json ./

# Copy Prisma files for migrations
COPY --from=build /app/prisma ./prisma

# Copy node_modules from build stage and prune dev dependencies
COPY --from=build /app/node_modules ./node_modules

# Fix permissions before pruning
RUN chown -R node:node /app

# Prune dev dependencies as node user
USER node
RUN npm prune --omit=dev
USER root

# Copy build artifacts from the build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# Set up cache directory with appropriate permissions
RUN mkdir -p .next/cache/images

# Fix all permissions for node user
RUN chown -R node:node /app

# Clean up redundant files
RUN npm cache clean --force && rm -rf /tmp/* /usr/share/man /var/cache/apk/*

# Expose the application port
EXPOSE 3000

# Create startup script to run migrations and start app
COPY --chown=node:node <<EOF /app/start.sh
#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma migrate deploy
echo "Starting application..."
exec npm start
EOF

RUN chmod +x /app/start.sh

# Use a non-root user for security
USER node

# Command to start the application
CMD ["/app/start.sh"]
