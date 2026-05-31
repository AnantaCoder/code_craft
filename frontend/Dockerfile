FROM oven/bun:latest

WORKDIR /app

# Copy package.json and lockfile to install dependencies first (caching layer)
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV BUN_PUBLIC_API_URL=http://localhost:8000/api

# Expose port 3000
EXPOSE 3000

# Start the Bun development/production server
CMD ["bun", "src/index.ts"]
