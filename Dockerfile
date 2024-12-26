FROM node:20-alpine3.19 AS base
WORKDIR /app
RUN apk add --no-cache dumb-init \
    && addgroup -S nodegroup \
    && adduser -S nodeuser -G nodegroup \
    && mkdir -p /app/logs \
    && chown -R nodeuser:nodegroup /app/logs


FROM base AS dependencies
COPY --chown=nodeuser:nodegroup package*.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force


FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=nodeuser:nodegroup . .


FROM base AS production
COPY --from=build /app .
COPY --from=dependencies /usr/bin/dumb-init /usr/bin/dumb-init
ENV NODE_ENV=production
EXPOSE 5000
USER nodeuser
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]