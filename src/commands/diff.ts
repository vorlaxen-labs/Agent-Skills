import { Command } from "commander";
import { compareContent, unifiedDiff, type FileDiff } from "../diff/unified.js";
import { pathExists, readTextFile } from "../fs.js";
import { readInstallManifest } from "../install/manifest.js";
import { planFromManifest } from "../install/run.js";
import { withWatermark, stripWatermark } from "../markdown.js";
import { logVerbose, printDiffResult, setOutputOptions } from "../output.js";

export interface DiffOptions {
  cwd?: string;
  verbose?: boolean;
  json?: boolean;
  noCache?: boolean;
}

export async function runDiff(options: DiffOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  const manifest = await readInstallManifest(cwd);
  logVerbose(`Planning diff for platform ${manifest.platform}`);

  const { planned } = await planFromManifest(cwd, manifest, options.noCache);
  const files: FileDiff[] = [];

  for (const write of planned) {
    const incoming = stripWatermark(withWatermark(write.content));
    const exists = await pathExists(write.dest);

    if (!exists) {
      files.push({
        dest: write.dest,
        status: "create",
        diff: unifiedDiff("/dev/null", write.dest, "", incoming),
      });
      continue;
    }

    const existing = stripWatermark(await readTextFile(write.dest));
    const status = compareContent(existing, incoming);
    files.push({
      dest: write.dest,
      status: status === "unchanged" ? "unchanged" : "modify",
      diff:
        status === "modify"
          ? unifiedDiff(write.dest, write.dest, existing, incoming)
          : undefined,
    });
  }

  printDiffResult({ files });
}

export function registerDiffCommand(program: Command): void {
  program
    .command("diff")
    .description("Show differences between installed files and latest snapshot")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("--verbose", "Verbose logging")
    .option("--json", "Machine-readable output")
    .option("--no-cache", "Bypass GitHub response cache")
    .action(async (opts) => {
      await runDiff({
        cwd: opts.cwd,
        verbose: opts.verbose,
        json: opts.json,
        noCache: opts.noCache,
      });
    });
}
