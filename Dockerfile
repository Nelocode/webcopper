# Use lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# System dependencies for Prisma and native extensions
RUN apk add --no-cache openssl python3 make g++

# Copy root files
COPY package*.json ./
COPY server.js ./
COPY start_system.js ./

# Copy CRM source and build it
COPY crm_source ./crm_source
RUN cd crm_source && npm install --omit=dev && npx prisma generate

# Copy proposal static files
COPY proposal ./proposal

# Expose port 80
EXPOSE 80

# Start Unified System
CMD ["node", "start_system.js"]
