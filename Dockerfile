# ── Build stage ──────────────────────────────────────────────
FROM rust:1.76-slim AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/Cargo.toml backend/Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs && cargo build --release && rm -rf src

COPY backend/src ./src
COPY backend/migrations ./migrations
RUN touch src/main.rs && cargo build --release

# ── Runtime stage ─────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/rustcms ./rustcms
COPY --from=builder /app/migrations ./migrations

ENV RUST_LOG=info
EXPOSE 8080

CMD ["./rustcms"]
