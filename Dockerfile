FROM docker:29-cli AS docker-cli

FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS tools
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
ARG WEATHROBE_SOURCE_ID=unverified
ENV WEATHROBE_SOURCE_ID=${WEATHROBE_SOURCE_ID}
LABEL org.opencontainers.image.version="0.6.0" org.opencontainers.image.revision=${WEATHROBE_SOURCE_ID}
COPY lib ./lib
COPY scripts/catalog ./scripts/catalog
COPY scripts/feedback ./scripts/feedback
COPY scripts/deploy ./scripts/deploy
COPY deploy ./deploy
COPY db ./db
COPY tsconfig.json ./
CMD ["npm", "run", "db:migrate"]

FROM dependencies AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ARG WEATHROBE_SOURCE_ID=unverified
ENV WEATHROBE_SOURCE_ID=${WEATHROBE_SOURCE_ID}
LABEL org.opencontainers.image.version="0.6.0" org.opencontainers.image.revision=${WEATHROBE_SOURCE_ID}
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --create-home nextjs \
    && mkdir -p /app/.data/community /app/.data/reports /app/.next/cache && chown -R nextjs:nodejs /app \
    && chmod 700 /app/.data/reports
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health',{signal:AbortSignal.timeout(8000)}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
