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
    TZ=America/Argentina/Cordoba

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar solo lo necesario desde el build
COPY --from=builder /usr/src/app/dist ./
COPY --from=builder /usr/src/app/package*.json ./

# Instalar dependencias
RUN npm clean-install --omit=dev

# mkdir keys
RUN mkdir keys

# Exponer puerto
EXPOSE 3000

RUN rm package*.json

# Comando de inicio
CMD ["node", "app.js"]
