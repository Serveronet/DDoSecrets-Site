# DDoSecrets Site

Distributed Denial of Secrets

This project is a mirror of a popular leaks site, implemented in Serveronet technology. It is built as a React app. The mirror was approved by the Distributed Denial of Secrets team.

## Prerequisites

To build this project you need Node.js 18 or newer (the current LTS release is recommended) and npm 9 or newer.

Install the dependencies before building or running the app:

```bash
npm install
```

## Configuration

Before building, edit `vite.config.js` and customize the `build.outDir` path so that it points to the `developed_sites` directory of your Serveronet installation. The path in the file is resolved relative to this project and must match where the Serveronet app stores its published sites (by default `../serveronet/serveronet-app/storage/app/developed_sites/ddosecrets`).

## Commands

Run the following npm scripts from the project root:

- `npm run dev` starts the Vite development server with hot reload.
- `npm run build` builds the production bundle and publishes it directly into the configured Serveronet `developed_sites` directory.
- `npm run preview` serves the built output locally for a final check.

## Disclaimer

This project is LLM generated and is not recommended for training.

## License

This project is licensed under the MIT License.
