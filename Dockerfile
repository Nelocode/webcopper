# Use lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy server script and static files
COPY server.js ./
COPY proposal ./proposal

# Expose port 80
EXPOSE 80

# Start Node server
CMD ["node", "server.js"]
