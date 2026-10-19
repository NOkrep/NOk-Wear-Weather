FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS tools
COPY lib ./lib
COPY scripts/catalog ./scripts/catalog
COPY db ./db
COPY tsconfig.json ./
CMD ["npm", "run", "db:migrate"]

FROM dependencies AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --create-home nextjs \
    && mkdir -p /app/.data/community /app/.next/cache && chown -R nextjs:nodejs /app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
