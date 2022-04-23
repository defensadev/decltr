import archiver from "archiver";
import dotenv from "dotenv";
import env from "env-var";
import { analyzeMetafile, build, Plugin } from "esbuild";
import fs from "fs-extra";

import {
    buildPath,
    eventSchemaPath,
    handlerJSPath,
    handlerTSPath,
    handlerZipPath,
} from "./env";
import { production } from "./parser";

dotenv.config();

const KRAKEN_API_KEY = env.get("KRAKEN_API_KEY").required().asString();
const KRAKEN_PRIVATE_KEY = env.get("KRAKEN_PRIVATE_KEY").required().asString();

const envPlugin: Plugin = {
    name: "envPlugin",
    setup: (build) => {
        build.onResolve({ filter: /_SECRETS$/ }, (args) => {
            return {
                path: args.path,
                namespace: "envPlugin-ns",
            };
        });

        build.onLoad({ filter: /.*/, namespace: "envPlugin-ns" }, () => ({
            contents: JSON.stringify({
                KRAKEN_API_KEY,
                KRAKEN_PRIVATE_KEY,
            }),
            loader: "json",
        }));
    },
};

const main = async () => {
    // some of these calls need to be in order, like ensureDir(buildPath), but others like writeFile(eventSchema), need not be, they are simply there for simplicity
    // the microscopic preformance gains for making this more illegible are too small.
    const { handler, eventSchema } = await production();
    await fs.ensureDir(buildPath);
    await fs.promises.writeFile(eventSchemaPath, eventSchema, "utf-8");
    await fs.promises.writeFile(handlerTSPath, handler, "utf-8");
    const buildResult = await build({
        bundle: true,
        entryPoints: [handlerTSPath],
        legalComments: "linked",
        outfile: handlerJSPath,
        platform: "node",
        minify: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        plugins: [envPlugin],
        target: "node14",
        treeShaking: true,
        write: true,
        metafile: true,
    });

    await new Promise<null>((res, rej) => {
        // create a file to stream archive data to.
        const output = fs.createWriteStream(handlerZipPath);
        const archive = archiver("zip", {
            zlib: { level: 6 },
        });

        output.on("close", () => res(null));
        archive.on("warning", rej);
        archive.on("error", rej);
        archive.pipe(output);
        archive.append(fs.createReadStream(handlerJSPath), { name: "index.js" });
        archive.append(fs.createReadStream(eventSchemaPath), {
            name: "event-schema.json",
        });
        archive.finalize();
    });

    const message = await analyzeMetafile(buildResult.metafile, { color: true });
    console.log(message);
};

main().catch((err) => console.error(err));
