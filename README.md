# pict-cli

`pict-cli` is a Node.js-friendly command-line tool for running PICT-style combinatorial test generation from npm, CI, or ad hoc shell usage.

This is an independent project by the package author and is not affiliated with Microsoft. It is inspired by Microsoft PICT and is intended to make similar workflows available in a Node.js environment, but it does not claim full command-line compatibility with the original `pict` executable.

## Requirements

- Node.js `^22 || ^24`

## Installation

Install `pict-cli` globally if you want a persistent local command:

```bash
npm install --global pict-cli
```

Run it without a global install for one-off usage:

```bash
npx pict-cli <model>
```

Use `npx` for ad hoc runs. Use a global install when you expect to run the command repeatedly on the same machine.

## Quick Start

Create a model file such as `model.txt`:

```txt
OS: Windows, Linux
Browser: Edge, Chrome, Firefox
```

Generate combinations with either a global install or `npx`:

```bash
pict-cli model.txt
npx pict-cli model.txt
```

Example output:

```text
OS	Browser
Windows	Edge
Windows	Chrome
Windows	Firefox
Linux	Edge
Linux	Chrome
Linux	Firefox
```

The generated result is written as tab-separated text.

## CLI Usage

```text
Usage: pict-cli model [options]
```

`model` must be exactly one argument: either a model file path or `-` to read the model from standard input.

| Option      | Description                                       |
| ----------- | ------------------------------------------------- |
| `-o N\|max` | Order of combinations. Default: `2`.              |
| `-d C`      | Separator for values. Default: `,`.               |
| `-a C`      | Separator for aliases. Default: `\|`.             |
| `-n C`      | Negative value prefix. Default: `~`.              |
| `-e file`   | File with seeding rows.                           |
| `-r N`      | Randomize generation with seed `N`.               |
| `-c`        | Enable case-sensitive model evaluation.           |
| `-s`        | Show model statistics instead of generated cases. |

Examples:

```bash
pict-cli model.txt -o 3 -c
pict-cli model.txt -r 42
pict-cli model.txt -e seed.tsv
cat model.txt | pict-cli -
npx pict-cli model.txt -s
```

## Compatibility and Limitations

- Only short options are supported.
- Slash-style syntax such as `/o:3` is not supported.
- Exactly one model argument is required.
- Use `-` as the model argument to read the model from standard input.

## License

This project is licensed under the MIT License—see the [LICENSE](./LICENSE) file for details.

## Disclaimer

pict-cli is provided "as is", without warranty of any kind. The authors are not liable for any damages arising from its use.

Generated test cases do _not guarantee complete coverage_ or _the absence of defects_. Please supplement pairwise testing with other strategies as appropriate.

pict-cli is an independent project and is not affiliated with Microsoft Corporation.

---

If you find pict-cli useful, please consider starring the repository.
