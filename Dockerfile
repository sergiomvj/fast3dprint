# Build Frontend
FROM node:20-alpine as frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Setup Backend & Serve
FROM python:3.10-slim

WORKDIR /app

# Install Backend Deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/ .

# Copy Frontend Build to a 'static' folder in Backend
COPY --from=frontend-builder /frontend/dist /app/static

EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
