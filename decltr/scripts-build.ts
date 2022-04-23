import { analyzeMetafile, build } from "esbuild";
import path from "path";

import NodeResolve from "@esbuild-plugins/node-resolve";

const scriptsBuild = async () => {
  const cwd = process.cwd();
  const entryPoints = ["start.ts", "build.ts"].map((p) =>
    path.join(cwd, "./decltr/scripts/src", p)
  );
  const outdir = path.join(cwd, "./decltr/scripts/dist");

  const result = await build({
    bundle: true,
    entryPoints,
    legalComments: "linked",
    outdir,
    platform: "node",
    plugins: [
      NodeResolve({
        extensions: [".ts", ".js"],
        onResolved: (resolved) => {
          if (resolved.includes("chalk")) {
            return resolved;
          }
          if (
            resolved.includes("node_modules") ||
            resolved.startsWith("node:")
          ) {
            return {
              external: true,
            };
          }
          return resolved;
        },
      }),
    ],
    target: "node14",
    treeShaking: true,
    write: true,
    metafile: true,
  });

  const res = await analyzeMetafile(result.metafile, { color: true });
  console.log(res);
};

scriptsBuild();
