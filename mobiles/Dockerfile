# Étape 1 : Build Ionic
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install -g @ionic/cli
RUN npm install
COPY . .
RUN ionic build --prod

# Étape 2 : Servir avec Nginx
FROM nginx:alpine
COPY --from=builder /app/www /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]