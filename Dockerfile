# Use Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# System dependencies for Prisma and native extensions (canvas, puppeteer)
RUN apk add --no-cache openssl python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev chromium

# Set Puppeteer executable path for Alpine
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy root files
COPY package*.json ./
COPY server.js ./
COPY start_system.js ./

# Copy CRM source and build it
COPY crm_source ./crm_source
RUN cd crm_source && npm install && npx prisma generate && npm run build

# Copy proposal static files
COPY proposal ./proposal

# Expose port 80
EXPOSE 80

# Start Unified System
CMD ["node", "start_system.js"]
