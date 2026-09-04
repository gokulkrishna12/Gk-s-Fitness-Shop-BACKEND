# Use the official Node.js image as the base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install dependencies (use npm ci for exact versions if you have a lock file, otherwise npm install)
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]