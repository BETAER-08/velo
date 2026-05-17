# Velo

A lightweight HTTP client built with Rust, Tauri, and React. Define your HTTP collections as YAML, manage environment variables, and run requests from either a desktop GUI or a CLI.

## Prerequisites

- Rust 1.80 or newer
- Node.js 20 or newer
- pnpm 9 or newer

## Workspace Layout

```
velo/
├── crates/
│   ├── velo-core/   core domain types, executor, file managers
│   └── velo-cli/    standalone `velo` CLI binary
├── src-tauri/       Tauri desktop shell
└── ui/              React + Tailwind frontend
```

## Data Directory

By default Velo reads collections and environments from `~/.velo/`:

```
~/.velo/
├── collections/
│   ├── api-tests.yaml
│   └── auth.yaml
└── environments/
    ├── local.yaml
    └── prod.yaml
```

### Collection YAML example

`~/.velo/collections/api-tests.yaml`:

```yaml
name: api-tests
description: Smoke tests for the public API
requests:
  - name: get-user
    method: GET
    url: "{{base_url}}/users/{{user_id}}"
    headers:
      Authorization: "Bearer {{token}}"
  - name: create-user
    method: POST
    url: "{{base_url}}/users"
    headers:
      Authorization: "Bearer {{token}}"
    body:
      name: "Alice"
      email: "alice@example.com"
```

### Environment YAML example

`~/.velo/environments/local.yaml`:

```yaml
name: local
values:
  base_url: "http://localhost:3000"
  user_id: "42"
  token: "dev-token"
```

## Running the GUI

```sh
cd ui
pnpm install
cd ..
pnpm --dir ui tauri dev
```

Or from the repo root with the Tauri CLI installed globally:

```sh
pnpm tauri dev
```

## Running the CLI

List collections or environments:

```sh
cargo run -p velo-cli -- list collections
cargo run -p velo-cli -- list environments
```

Run a request:

```sh
cargo run -p velo-cli -- run api-tests get-user --env local
```

Override the base path:

```sh
cargo run -p velo-cli -- run api-tests get-user --env local --base-path /path/to/.velo
```

## Building

Desktop bundles:

```sh
pnpm --dir ui install
pnpm --dir ui tauri build
```

CLI release binary:

```sh
cargo build -p velo-cli --release
```

The CLI binary will be at `target/release/velo`.
