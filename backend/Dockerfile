FROM python:3.11-slim

# Install system dependencies and Docker CLI client
# This allows the backend container to execute docker commands on the host's daemon
RUN apt-get update && apt-get install -y \
    curl \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY . .

# Set default environment variables
ENV SANDBOX_MODE=docker
ENV TMPDIR=/tmp/code_craft

# Expose port 8000
EXPOSE 8000

# Start FastAPI using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
