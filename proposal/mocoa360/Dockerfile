FROM nginx:alpine

# Copiar el visor y los frames
COPY index.html /usr/share/nginx/html/
COPY frames/ /usr/share/nginx/html/frames/

# Configuración nginx: compresión, cache, CORS
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
