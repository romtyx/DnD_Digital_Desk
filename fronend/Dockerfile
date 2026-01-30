FROM oven/bun:1.3.1

WORKDIR /app

COPY package.json bun.lock bunfig.toml /app/
RUN bun install --frozen-lockfile

COPY . /app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "src/index.ts"]
