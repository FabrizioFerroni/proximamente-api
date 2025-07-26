# ---------- Stage 1: Build ----------
FROM node:lts-alpine as builder

# Set workdir
WORKDIR /usr/src/app

# Copiar solo lo necesario para instalar y compilar
COPY package*.json ./
RUN npm clean-install

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:lts-alpine

# Set environment variables
ENV NODE_ENV=production \
    TZ=America/Argentina/Buenos_Aires

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar solo lo necesario desde el build
COPY --from=builder /usr/src/app/dist ./
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "app.js"]
