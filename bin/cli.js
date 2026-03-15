#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { argv, exit, stderr, stdin, stdout } from "node:process";
import { parseArgs } from "node:util";
import { PictError, PictErrorCode, PictRunner } from "@takeyaqa/pict-wasm";

const USAGE = `Pairwise Independent Combinatorial Testing

Usage: pict-cli model [options]

model may be a file path or - to read from standard input.

Options:
  -o N|max  Order of combinations (default: 2)
  -d C      Separator for values (default: ,)
  -a C      Separator for aliases (default: |)
  -n C      Negative value prefix (default: ~)
  -e file   File with seeding rows
  -r N      Randomize generation with seed N
  -c        Case-sensitive model evaluation
  -s        Show model statistics`;

const OPTIONS = {
  o: { type: "string", short: "o" },
  d: { type: "string", short: "d" },
  a: { type: "string", short: "a" },
  n: { type: "string", short: "n" },
  e: { type: "string", short: "e" },
  r: { type: "string", short: "r" },
  c: { type: "boolean", short: "c" },
  s: { type: "boolean", short: "s" },
};

class CliError extends Error {
  constructor(code, message, stream = "stderr") {
    super(message);
    this.name = "CliError";
    this.code = code;
    this.stream = stream;
  }
}

function writeLine(stream, text) {
  if (!text) {
    return;
  }
  stream.write(text.endsWith("\n") ? text : `${text}\n`);
}

function usageError() {
  return new CliError(PictErrorCode.BadOption, USAGE, "stdout");
}

function inputError(message) {
  return new CliError(PictErrorCode.BadOption, `Input Error: ${message}`);
}

function rejectUnsupportedSyntax(rawArgs) {
  for (const arg of rawArgs) {
    if (/^--[^-]/.test(arg)) {
      throw inputError(`Unknown option: ${arg}`);
    }

    if (/^\/[A-Za-z](?::.*)?$/.test(arg) || arg === "/?") {
      throw inputError(`Unknown option: ${arg}`);
    }

    if (/^-[A-Za-z]=/.test(arg)) {
      throw inputError(`Unknown option: ${arg}`);
    }

    if (/^-[A-Za-z]:/.test(arg)) {
      throw inputError(`Unknown option: ${arg}`);
    }

    if (/^-[A-Za-z]{2,}$/.test(arg)) {
      throw inputError(`Unknown option: ${arg}`);
    }
  }
}

function getOptionSource(token, rawArgs) {
  return rawArgs[token.index] ?? token.rawName;
}

function validateTokens(parsed, rawArgs) {
  const seenOptions = new Set();
  const optionSources = new Map();

  for (const token of parsed.tokens) {
    if (token.kind !== "option") {
      continue;
    }

    if (!(token.name in OPTIONS)) {
      throw inputError(`Unknown option: ${getOptionSource(token, rawArgs)}`);
    }

    if (seenOptions.has(token.name)) {
      throw inputError(`Option '${token.name}' was provided more than once`);
    }

    seenOptions.add(token.name);
    optionSources.set(token.name, getOptionSource(token, rawArgs));
  }

  return optionSources;
}

function getRequiredString(values, optionName, optionSources) {
  const value = values[optionName];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw inputError(`Unknown option: ${optionSources.get(optionName)}`);
  }

  return value;
}

function getSingleCharacterValue(values, optionName, optionSources) {
  const value = getRequiredString(values, optionName, optionSources);
  if (value === undefined) {
    return undefined;
  }

  if (value.length !== 1) {
    throw inputError(`Unknown option: ${optionSources.get(optionName)}`);
  }

  return value;
}

function buildRunConfig(rawArgs) {
  if (rawArgs.length === 0) {
    throw usageError();
  }

  rejectUnsupportedSyntax(rawArgs);

  const parsed = parseArgs({
    args: rawArgs,
    options: OPTIONS,
    allowPositionals: true,
    strict: false,
    tokens: true,
  });
  const optionSources = validateTokens(parsed, rawArgs);

  if (parsed.positionals.length !== 1) {
    if (parsed.positionals.length === 0) {
      throw usageError();
    }
    throw inputError("Exactly one model argument is required");
  }

  const orderOfCombinations = getRequiredString(
    parsed.values,
    "o",
    optionSources,
  );
  if (
    orderOfCombinations !== undefined &&
    !(
      orderOfCombinations === "max" ||
      (/^\d+$/.test(orderOfCombinations) &&
        Number.parseInt(orderOfCombinations, 10) > 0)
    )
  ) {
    throw inputError(`Unknown option: ${optionSources.get("o")}`);
  }

  const randomizeSeed = getRequiredString(parsed.values, "r", optionSources);
  if (randomizeSeed !== undefined && !/^\d+$/.test(randomizeSeed)) {
    throw inputError(`Unknown option: ${optionSources.get("r")}`);
  }

  const valueSeparator = getSingleCharacterValue(
    parsed.values,
    "d",
    optionSources,
  );
  const aliasSeparator = getSingleCharacterValue(
    parsed.values,
    "a",
    optionSources,
  );
  const negativeValuePrefix = getSingleCharacterValue(
    parsed.values,
    "n",
    optionSources,
  );

  return {
    modelPath: parsed.positionals[0],
    seedFilePath: getRequiredString(parsed.values, "e", optionSources),
    options: {
      ...(orderOfCombinations !== undefined
        ? {
            orderOfCombinations:
              orderOfCombinations === "max"
                ? "max"
                : Number.parseInt(orderOfCombinations, 10),
          }
        : {}),
      ...(valueSeparator !== undefined ? { valueSeparator } : {}),
      ...(aliasSeparator !== undefined ? { aliasSeparator } : {}),
      ...(negativeValuePrefix !== undefined ? { negativeValuePrefix } : {}),
      ...(randomizeSeed !== undefined
        ? {
            randomizeGeneration: true,
            randomizeSeed: Number.parseInt(randomizeSeed, 10),
          }
        : {}),
      ...(parsed.values.c ? { caseSensitive: true } : {}),
      ...(parsed.values.s ? { showModelStatistics: true } : {}),
    },
  };
}

async function readHostFile(filePath, errorCode) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    throw new CliError(
      errorCode,
      `Input Error: Couldn't open file: ${filePath}`,
    );
  }
}

async function readStdin() {
  return await new Promise((resolve, reject) => {
    let text = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      text += chunk;
    });
    stdin.on("end", () => {
      resolve(text);
    });
    stdin.on("error", () => {
      reject(
        new CliError(
          PictErrorCode.BadModel,
          "Input Error: Couldn't read standard input",
        ),
      );
    });
  });
}

async function readModelText(modelArg) {
  if (modelArg === "-") {
    return await readStdin();
  }

  return await readHostFile(modelArg, PictErrorCode.BadModel);
}

function formatResult(result) {
  return [result.header, ...result.body]
    .map((row) => row.join("\t"))
    .join("\n");
}

async function main(rawArgs) {
  const config = buildRunConfig(rawArgs);
  const modelText = await readModelText(config.modelPath);

  if (config.seedFilePath !== undefined) {
    config.options.seedRowsText = await readHostFile(
      config.seedFilePath,
      PictErrorCode.BadRowSeedFile,
    );
  }

  const runner = await PictRunner.create();
  const output = runner.runModel(modelText, { options: config.options });

  if (output.message) {
    writeLine(stderr, output.message);
  }

  if (config.options.showModelStatistics) {
    writeLine(stdout, output.modelStatistics ?? "");
    return PictErrorCode.Success;
  }

  writeLine(stdout, formatResult(output.result));
  return PictErrorCode.Success;
}

try {
  const exitCode = await main(argv.slice(2));
  exit(exitCode);
} catch (error) {
  if (error instanceof CliError) {
    writeLine(error.stream === "stdout" ? stdout : stderr, error.message);
    exit(error.code);
  }

  if (error instanceof PictError) {
    writeLine(stderr, error.message);
    exit(error.code);
  }

  if (error instanceof Error) {
    writeLine(stderr, `Fatal error: ${error.message}`);
  } else {
    writeLine(stderr, "Fatal error: Unknown error");
  }
  exit(1);
}
