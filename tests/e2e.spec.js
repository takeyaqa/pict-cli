import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { cwd, env, execPath } from "node:process";
import { after, before, describe, it } from "node:test";

const CLI_PATH = resolve(cwd(), "bin/cli.js");

function runCli(args) {
  return spawnSync(execPath, [CLI_PATH, ...args], {
    cwd: cwd(),
    encoding: "utf8",
    env: { ...env, NODE_NO_WARNINGS: "1" },
  });
}

describe("pict-cli", () => {
  let tempDir;
  let basicModelPath;
  let caseSensitiveModelPath;
  let seedModelPath;
  let seedFilePath;
  let invalidModelPath;
  let missingModelPath;
  let missingSeedPath;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), "pict-cli-"));

    basicModelPath = join(tempDir, "basic.txt");
    writeFileSync(
      basicModelPath,
      `A: 0, 1
B: x, y`,
    );

    caseSensitiveModelPath = join(tempDir, "case-sensitive.txt");
    writeFileSync(
      caseSensitiveModelPath,
      `OS: Windows, Linux
os: windows, linux`,
    );

    seedModelPath = join(tempDir, "seed-model.txt");
    writeFileSync(
      seedModelPath,
      `A: 0, 1
B: 0, 1
C: 0, 1
D: 0, 1`,
    );

    seedFilePath = join(tempDir, "seed.tsv");
    writeFileSync(seedFilePath, "A\tB\tC\tD\n0\t0\t0\t0");

    invalidModelPath = join(tempDir, "invalid.txt");
    writeFileSync(
      invalidModelPath,
      `A: 0, 1
A: x, y`,
    );

    missingModelPath = join(tempDir, "missing-model.txt");
    missingSeedPath = join(tempDir, "missing-seed.tsv");
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("runs a model file with a positional path only", () => {
    const result = runCli([basicModelPath]);
    const outputLines = result.stdout.trim().split("\n");

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(outputLines[0], "A\tB");
    assert.deepEqual(outputLines.slice(1).sort(), [
      "0\tx",
      "0\ty",
      "1\tx",
      "1\ty",
    ]);
  });

  it("supports documented short options", () => {
    const orderResult = runCli([basicModelPath, "-o", "1"]);
    assert.equal(orderResult.status, 0);
    assert.ok(orderResult.stdout.includes("A\tB"));

    const caseResult = runCli([caseSensitiveModelPath, "-c"]);
    assert.equal(caseResult.status, 0);
    assert.ok(caseResult.stdout.includes("OS\tos"));

    const statsResult = runCli([basicModelPath, "-s"]);
    assert.equal(statsResult.status, 0);
    assert.ok(statsResult.stdout.includes("Combinations:"));
    assert.ok(statsResult.stdout.includes("Generation time:"));

    const seedResult = runCli([seedModelPath, "-e", seedFilePath]);
    assert.equal(seedResult.status, 0);
    assert.ok(seedResult.stdout.includes("0\t0\t0\t0"));

    const randomResult = runCli([basicModelPath, "-r", "42"]);
    assert.equal(randomResult.status, 0);
    assert.ok(randomResult.stderr.includes("Used seed: 42"));
  });

  it("rejects unsupported syntax and bad usage", () => {
    const noArgsResult = runCli([]);
    assert.equal(noArgsResult.status, 3);
    assert.ok(noArgsResult.stdout.includes("Usage: pict-cli model [options]"));

    const duplicateOptionResult = runCli([
      basicModelPath,
      "-o",
      "1",
      "-o",
      "2",
    ]);
    assert.equal(duplicateOptionResult.status, 3);
    assert.ok(
      duplicateOptionResult.stderr.includes(
        "Input Error: Option 'o' was provided more than once",
      ),
    );

    const missingModelResult = runCli(["-c"]);
    assert.equal(missingModelResult.status, 3);
    assert.ok(
      missingModelResult.stdout.includes("Usage: pict-cli model [options]"),
    );

    const extraPositionalResult = runCli([
      basicModelPath,
      caseSensitiveModelPath,
    ]);
    assert.equal(extraPositionalResult.status, 3);
    assert.ok(
      extraPositionalResult.stderr.includes(
        "Input Error: Exactly one model file path is required",
      ),
    );

    const slashOptionResult = runCli([basicModelPath, "/o:1"]);
    assert.equal(slashOptionResult.status, 3);
    assert.ok(
      slashOptionResult.stderr.includes("Input Error: Unknown option: /o:1"),
    );

    const equalsOptionResult = runCli([basicModelPath, "-o=1"]);
    assert.equal(equalsOptionResult.status, 3);
    assert.ok(
      equalsOptionResult.stderr.includes("Input Error: Unknown option: -o=1"),
    );

    const colonOptionResult = runCli([basicModelPath, "-o:1"]);
    assert.equal(colonOptionResult.status, 3);
    assert.ok(
      colonOptionResult.stderr.includes("Input Error: Unknown option: -o:1"),
    );

    const longOptionResult = runCli([basicModelPath, "--order", "1"]);
    assert.equal(longOptionResult.status, 3);
    assert.ok(
      longOptionResult.stderr.includes("Input Error: Unknown option: --order"),
    );

    const bareRandomResult = runCli([basicModelPath, "-r"]);
    assert.equal(bareRandomResult.status, 3);
    assert.ok(
      bareRandomResult.stderr.includes("Input Error: Unknown option: -r"),
    );
  });

  it("propagates wasm and host file errors as exit codes", () => {
    const invalidModelResult = runCli([invalidModelPath]);
    assert.equal(invalidModelResult.status, 4);
    assert.ok(invalidModelResult.stderr.includes("Input Error:"));

    const missingModelResult = runCli([missingModelPath]);
    assert.equal(missingModelResult.status, 4);
    assert.ok(
      missingModelResult.stderr.includes(
        `Input Error: Couldn't open file: ${missingModelPath}`,
      ),
    );

    const missingSeedResult = runCli([basicModelPath, "-e", missingSeedPath]);
    assert.equal(missingSeedResult.status, 6);
    assert.ok(
      missingSeedResult.stderr.includes(
        `Input Error: Couldn't open file: ${missingSeedPath}`,
      ),
    );
  });
});
