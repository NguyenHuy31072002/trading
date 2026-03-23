FROM node:22-slim AS frontend-build
WORKDIR /app/web/frontend
COPY web/frontend/package*.json ./
RUN npm ci
COPY web/frontend/ ./
RUN npm run build

FROM python:3.13-slim
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt pyproject.toml ./
COPY tradingagents/ tradingagents/
COPY cli/ cli/
COPY web/backend/requirements.txt web/backend/requirements.txt
RUN pip install --no-cache-dir . && \
    pip install --no-cache-dir -r web/backend/requirements.txt

# Copy backend
COPY web/backend/ web/backend/

# Copy built frontend
COPY --from=frontend-build /app/web/frontend/dist web/frontend/dist

# Copy other needed files
COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "web.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
