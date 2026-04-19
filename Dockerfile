FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy the backend package.json first to leverage Docker cache
COPY server/package*.json ./server/

# Install the server dependencies
RUN cd server && npm install --production

# Copy the rest of the application (both public/ and server/)
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application securely
CMD ["node", "server/server.js"]
