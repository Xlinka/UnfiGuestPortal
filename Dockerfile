FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Build React app
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server/index.js"]
