# ── Build stage ──
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production stage ──
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Audio uploads volume mount point
RUN mkdir -p /app/uploads/audio

EXPOSE 3000

CMD ["node", "dist/main.js"]
