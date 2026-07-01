# Use lightweight Nginx alpine image
FROM nginx:alpine

# Copy the static site files into the Nginx HTML directory
COPY ./proposal /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
