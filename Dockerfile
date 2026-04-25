# ── Stage 1: Builder ──────────────────────────────────────────────
FROM rust:1.87-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY backend/Cargo.toml backend/Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs
RUN cargo build --release && rm -f target/release/deps/rustcms*

COPY backend/src ./src
COPY backend/migrations ./migrations
RUN cargo build --release

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/rustcms .
COPY --from=builder /app/migrations ./migrations

RUN useradd -r -s /bin/false appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["./rustcms"]
