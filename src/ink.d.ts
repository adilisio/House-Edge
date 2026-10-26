// .ink files are compiled to story JSON by the ink plugin in vite.config.ts.
declare module "*.ink" {
  const json: string;
  export default json;
}

/** An Ink script's source text, for tests that compile an edited copy. */
declare module "*.ink?raw" {
  const source: string;
  export default source;
}
