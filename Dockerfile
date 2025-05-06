FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy only package files first for better caching
COPY package.json ./

# Install all dependencies including server ones
RUN npm install --no-package-lock

# Make sure all server dependencies are installed explicitly
RUN npm install --no-package-lock cors express mongoose morgan jsonwebtoken stripe

# Copy app source
COPY . .

# Build React app
RUN npm run build

# Expose the new port
EXPOSE 3881

# Start server with the correct port
CMD ["node", "server/index.js"]
