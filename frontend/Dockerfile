# Etapa de construcción
FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Instalar servidor HTTP simple
RUN npm install -g serve

# Copiar los archivos construidos desde la etapa anterior
COPY --from=build /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["serve", "-s", "dist", "-l", "3000"]
