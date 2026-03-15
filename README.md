# pict-cli

`pict-cli` is a Node.js-friendly command-line tool for running PICT-style
combinatorial test generation from npm, CI, or ad hoc shell usage.

This is an independent project by the package author and is not affiliated with
Microsoft. It is inspired by Microsoft PICT and is intended to make similar
workflows available in a Node.js environment, but it does not claim full
command-line compatibility with the original `pict` executable.

## Requirements

- Node.js `^22 || ^24`

## Installation

Install `pict-cli` globally if you want a persistent local command:

```bash
npm install --global pict-cli
```

Run it without a global install for one-off usage or CI steps:

```bash
npx pict-cli <model-file>
```

Use `npx` for ad hoc runs and CI jobs. Use a global install when you expect to
run the command repeatedly on the same machine.

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

The generated result is written as tab-separated text. If you pass `-s`, the
command prints model statistics instead of generated cases.

## CLI Usage

```text
Usage: pict-cli model [options]
```

`model` must be exactly one model file path.

| Option      | Description                                       |
| ----------- | ------------------------------------------------- |
| `-o N\|max` | Order of combinations. Default: `2`.              |
| `-d C`      | Separator for values. Default: `,`.               |
| `-a C`      | Separator for aliases. Default: `\`.              |
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
npx pict-cli model.txt -s
```

## Compatibility and Limitations

- Only short options are supported.
- Slash-style syntax such as `/o:3` is not supported.
- Exactly one model file path is required.

## Relationship to Microsoft PICT

Microsoft PICT is the original combinatorial testing tool that inspired this
package. `pict-cli` brings a similar workflow to Node.js through npm
distribution and a JavaScript runtime, but it is not an official Microsoft
package and is not endorsed or supported by Microsoft.

## Project Links

- Issues: [github.com/takeyaqa/pict-cli/issues](https://github.com/takeyaqa/pict-cli/issues)
- License: [MIT](https://github.com/takeyaqa/pict-cli/blob/main/LICENSE)

Bug reports and compatibility gaps are welcome.
