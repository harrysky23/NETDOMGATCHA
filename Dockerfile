# React와 FastAPI를 같은 서비스/도메인으로 배포합니다.
FROM node:22-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY asset/scrapbooks/ /build/asset/scrapbooks/
ENV VITE_API_MODE=http VITE_API_BASE_URL=/api
RUN npm run build

FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY --from=frontend /build/backend/app/sticker_manifest.json ./app/sticker_manifest.json
COPY supabase/migrations /app/supabase/migrations
COPY --from=frontend /build/frontend/dist /app/frontend/dist
RUN useradd --create-home --uid 10001 netapp
USER netapp
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port \"${PORT:-8000}\""]
