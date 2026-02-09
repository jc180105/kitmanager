# Use Node.js 20 based on Alpine Linux for a lightweight image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy backend package files first to leverage Docker cache
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Copy the rest of the backend source code
COPY backend/ ./

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
