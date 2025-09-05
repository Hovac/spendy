FROM node:20-bullseye

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies for building native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --build-from-source

# Copy app code
COPY . .

# Expose port
EXPOSE 8119

# Run the server
CMD ["node", "spendy_app/server.js"]
