# Base image
FROM node:lts-alpine

# Set environment variables
ENV NODE_ENV=production \
    TZ=America/Argentina/Cordoba

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

RUN npm run build

# Bundle app source
COPY dist/ .

# Start the server using the production build
CMD [ "node", "app.js" ]

# Exposing server port
EXPOSE 3000