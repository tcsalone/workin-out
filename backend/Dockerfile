# Use Node.js 18 (LTS)
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Set environment variable for production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
