# Tokyo Predictor Roulette - Production Dockerfile

FROM node:20-alpine

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies
# Using npm install --production for better compatibility
RUN npm install --production

# Copy application code
COPY server.js ./
COPY healthcheck.js ./
COPY src ./src

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Change ownership of all files to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check using shared script
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
