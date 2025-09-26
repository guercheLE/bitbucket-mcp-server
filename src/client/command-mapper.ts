import { Command, Option } from 'commander';

import type { McpService } from './mcp-service';
import type { CapabilityDiscoveryResult, ToolCapability, ToolParameter } from './types';

export interface CommandMapper {
  registerCapabilities(capabilities: CapabilityDiscoveryResult): void;
}

export class DefaultCommandMapper implements CommandMapper {
  private readonly registered = new Map<string, Command>();

  constructor(
    private readonly program: Command,
    private readonly service: McpService,
    private readonly stdout: NodeJS.WritableStream = process.stdout,
    private readonly stderr: NodeJS.WritableStream = process.stderr,
  ) {}

  registerCapabilities(capabilities: CapabilityDiscoveryResult): void {
    this.removeRegisteredCommands();

    const tools = [...capabilities.tools].sort((a, b) => a.name.localeCompare(b.name));
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  private removeRegisteredCommands(): void {
    if (this.registered.size === 0) {
      return;
    }

    this.registered.clear();
  }

  private registerTool(tool: ToolCapability): void {
    const command = this.program.command(tool.name);

    const descriptionParts = [tool.title, tool.description].filter(Boolean);
    if (descriptionParts.length > 0) {
      command.description(descriptionParts.join(' - '));
    }

    const parameters = tool.parameters ?? [];
    for (const parameter of parameters) {
      command.addOption(this.createOption(parameter));
    }

    command.action(async () => {
      try {
        const payload = this.buildPayload(parameters, command);
        const result = await this.service.executeTool(tool.name, payload);
        this.writeOutput(result);
      } catch (error) {
        this.writeError(error);
        throw error;
      }
    });

    this.registered.set(tool.name, command);
  }

  private createOption(parameter: ToolParameter): Option {
    const flag = `--${parameter.name} <${parameter.name}>`;
    const option = new Option(flag, parameter.description);

    if (parameter.type === 'number') {
      option.argParser((value: string) => Number(value));
    } else if (parameter.type === 'boolean') {
      option.argParser((value: string) => value !== 'false');
    }

    if (parameter.required) {
      option.makeOptionMandatory();
    }

    return option;
  }

  private buildPayload(parameters: ToolParameter[], command: Command): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const parameter of parameters) {
      const attribute = this.getAttributeName(parameter.name);
      const value = command.getOptionValue(attribute);
      if (value !== undefined) {
        payload[parameter.name] = value;
      }
    }
    return payload;
  }

  private getAttributeName(parameterName: string): string {
    return parameterName
      .split('-')
      .map((segment, index) => {
        if (index === 0) {
          return segment;
        }
        return segment.charAt(0).toUpperCase() + segment.slice(1);
      })
      .join('');
  }

  private writeOutput(result: unknown): void {
    if (result === undefined) {
      return;
    }

    const serialized = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    this.stdout.write(`${serialized}\n`);
  }

  private writeError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.stderr.write(`${message}\n`);
  }
}
