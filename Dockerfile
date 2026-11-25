# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24.19.0-bookworm-slim
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run typecheck && npm run build && npm prune --omit=dev --no-audit --no-fund

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
RUN mkdir -p /app/data /app/public/uploads && chown -R node:node /app/data /app/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/server.cjs"]

# Render's fresh persistent disk can be root-owned. Only the entrypoint performs
# ownership setup; the application itself runs as node, just like the local image.
FROM runtime AS render
USER root
COPY scripts/render-entrypoint.sh /app/scripts/render-entrypoint.sh
COPY scripts/import-render-data.mjs /app/scripts/import-render-data.mjs
RUN sed -i 's/\r$//' /app/scripts/render-entrypoint.sh && chmod 0755 /app/scripts/render-entrypoint.sh
ENV APP_DATA_DIR=/app/data/runtime
ENTRYPOINT ["/bin/sh", "/app/scripts/render-entrypoint.sh"]
CMD ["node", "dist/server.cjs"]
