# Chess-Tutor App (Under construction)

## Purpose
You can use the app to learn chess and understand chess tactics from basics to advanced, compare your skills against a computer that can analyze your games, and then help you understand how best to get started playing chess.


## Setup
Requires Node.js 20.19+ or 22.12+ and Yarn 1. A conda environment works:

```
conda create -n chess-app -c conda-forge nodejs=22 yarn=1.22
conda activate chess-app
yarn install
```

## Available Scripts
Built with [Vite](https://vite.dev), React and TypeScript. In the project directory, you can run:

### `yarn start`

Runs the app in development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser. The page updates as you edit.

### `yarn test`

Runs the tests with [Vitest](https://vitest.dev) in watch mode. Use `yarn test run` to run them once.

### `yarn lint`

Checks the code with [oxlint](https://oxc.rs/docs/guide/usage/linter).

### `yarn build`

Type-checks the code and builds the app for production to the `dist` folder.

### `yarn preview`

Serves the production build locally to check it before deploying.
