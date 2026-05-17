# Velo

A fast, keyboard-friendly HTTP client for developers — desktop GUI and CLI in one tool.

## Prerequisites

- Rust 1.80+
- Node.js 20+
- pnpm

## Directory Structure

```
~/.velo/
├── collections/
│   └── api-tests.yaml
└── environments/
    └── dev.yaml
```

## Collection YAML Example

```yaml
name: api-tests
description: API test collection
requests:
  - id: req-001
    name: Get Users
    method: GET
    url: "{{base_url}}/users"
    headers:
      Authorization: "Bearer {{token}}"
    body: null
    description: Fetch all users
  - id: req-002
    name: Create User
    method: POST
    url: "{{base_url}}/users"
    headers: {}
    body:
      name: Alice
      email: alice@example.com
    description: Create a new user
```

## Environment YAML Example

```yaml
name: dev
values:
  base_url: http://localhost:8080
  token: my-secret-token
```

## Run GUI

```bash
pnpm tauri dev
```

## Run CLI

```bash
cargo run -p velo-cli -- run <collection> <request> --env <env>
cargo run -p velo-cli -- list collections
cargo run -p velo-cli -- list environments
```

Custom base path:

```bash
cargo run -p velo-cli -- run api-tests "Get Users" --env dev --base-path /path/to/velo
```

## Build

```bash
pnpm tauri build
```
