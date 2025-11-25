/**
 * CodeGen CLI - Command-line interface
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parseArgs } from 'node:util';

interface CLIOptions {
  json?: boolean;
  spec?: string;
  host?: string;
  port?: string;
}

interface CLICommand {
  name: string;
  description: string;
  execute: (args: string[], options: CLIOptions) => Promise<void>;
}

const DEFAULT_HOST = process.env.CODEGEN_HOST || 'http://localhost:3000';

class CodeGenCLI {
  private commands: Map<string, CLICommand> = new Map();

  constructor() {
    this.registerCommands();
  }

  private registerCommands(): void {
    // list command
    this.commands.set('list', {
      name: 'list',
      description: 'List available generators',
      execute: async (_, options) => {
        await this.listGenerators(options);
      },
    });

    // generate command
    this.commands.set('generate', {
      name: 'generate',
      description: 'Generate code from a specification',
      execute: async (args, options) => {
        await this.generate(args, options);
      },
    });

    // help command
    this.commands.set('help', {
      name: 'help',
      description: 'Show help message',
      execute: async () => {
        this.showHelp();
      },
    });
  }

  async run(args: string[]): Promise<void> {
    try {
      const [command, ...rest] = args;

      if (!command || command === 'help') {
        this.showHelp();
        return;
      }

      const cmd = this.commands.get(command);
      if (!cmd) {
        console.error(`Unknown command: ${command}`);
        console.error('Use "codegen help" for usage information');
        process.exit(1);
      }

      const { values: options } = parseArgs({
        args: rest,
        options: {
          json: { type: 'boolean', short: 'j' },
          spec: { type: 'string', short: 's' },
          host: { type: 'string' },
          port: { type: 'string' },
        },
        allowPositionals: true,
      });

      await cmd.execute(rest, options as CLIOptions);
    } catch (err) {
      console.error(
        'Error:',
        err instanceof Error ? err.message : String(err),
      );
      process.exit(1);
    }
  }

  private showHelp(): void {
    console.log(`
CodeGen - Code Generator CLI

Usage:
  codegen <command> [options]

Commands:
  list                  List available generators
  generate <id>         Generate code from a specification
  help                  Show this help message

Options:
  --json, -j           Output as JSON
  --spec, -s <file>    Path to specification file
  --host <url>         CodeGen service URL (default: http://localhost:3000)

Examples:
  codegen list
  codegen list --json
  codegen generate hello-world --spec spec.json
  codegen generate hello-world --spec spec.json --json
`);
  }

  private async listGenerators(options: CLIOptions): Promise<void> {
    try {
      const host = options.host || DEFAULT_HOST;
      const response = await fetch(`${host}/api/generators`);

      if (!response.ok) {
        throw new Error(
          `Failed to list generators: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (options.json) {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const { generators } = data as {
          generators: Array<{
            id: string;
            version: string;
            displayName: string;
            description: string;
          }>;
        };

        console.log('\nAvailable Generators:\n');
        for (const gen of generators) {
          console.log(`  ${gen.id}@${gen.version}`);
          console.log(`    ${gen.displayName}`);
          console.log(`    ${gen.description}\n`);
        }
      }
    } catch (err) {
      throw new Error(
        `Failed to list generators: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async generate(
    args: string[],
    options: CLIOptions,
  ): Promise<void> {
    try {
      const generatorId = args[0];
      if (!generatorId) {
        throw new Error('Generator ID is required');
      }

      const specPath = options.spec;
      if (!specPath) {
        throw new Error('Specification file is required (--spec <file>)');
      }

      // Read spec file
      const specContent = await fs.readFile(specPath, 'utf-8');
      let spec: unknown;
      try {
        spec = JSON.parse(specContent);
      } catch {
        throw new Error(`Invalid JSON in specification file: ${specPath}`);
      }

      // Call generate API
      const host = options.host || DEFAULT_HOST;
      const response = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatorId,
          spec,
          tenantId: 'default',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Generation failed: ${errorData.error || response.statusText}`,
        );
      }

      const result = await response.json();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\nGeneration completed successfully!\n`);
        console.log(`Artifact ID: ${result.artifactId}`);
        console.log(`Generated ${result.files.length} file(s):\n`);

        for (const file of result.files as Array<{ path: string; size: number }>) {
          console.log(`  - ${file.path} (${file.size} bytes)`);
        }

        if (result.diagnostics.length > 0) {
          console.log(`\nDiagnostics:\n`);
          for (const diag of result.diagnostics as Array<{ level: string; message: string }>) {
            console.log(`  [${diag.level.toUpperCase()}] ${diag.message}`);
          }
        }
        console.log();
      }
    } catch (err) {
      throw new Error(
        `Generation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

export async function main(): Promise<void> {
  const cli = new CodeGenCLI();
  const args = process.argv.slice(2);
  await cli.run(args);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
