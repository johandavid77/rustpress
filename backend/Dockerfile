FROM docker.io/library/rust:1.77-alpine AS builder
RUN apk add --no-cache musl-dev openssl-dev pkgconfig
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM docker.io/library/alpine:3.19
RUN apk add --no-cache openssl ca-certificates curl
WORKDIR /app
COPY --from=builder /app/target/release/rustcms .
RUN mkdir -p uploads backups
EXPOSE 8080
CMD ["./rustcms"]
