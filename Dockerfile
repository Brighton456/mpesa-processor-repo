# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock to leverage Docker cache
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --production --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the application
CMD ["node", "index.js"]
