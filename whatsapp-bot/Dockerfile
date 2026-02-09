FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies including system libraries for canvas/pdf if needed (though basic bot might not need them, pdfkit sometimes does)
# For now, keeping it simple. If pdfkit needs fonts/libs, we might need to add them.
# package.json has pdfkit. Alpine might need fontconfig or similar?
# Let's start with basic node:20-alpine.

RUN npm install

COPY . .

# No specific port exposed solely for bot, but good practice.
# Does it run a server? server.js implies yes.
# Looking at file list, it has express in package.json.
# Let's assume it listens on a port (likely defined in env or default)
# Expose generic port or skip EXPOSE if not strictly needed (Railway handles PORT env var)

CMD ["npm", "start"]
