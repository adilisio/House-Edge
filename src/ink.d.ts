// .ink files are compiled to story JSON by the ink plugin in vite.config.ts.
declare module "*.ink" {
  const json: string;
  export default json;
}
