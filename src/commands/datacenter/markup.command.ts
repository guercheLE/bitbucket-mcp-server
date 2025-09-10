/**
 * Data Center Markup Commands
 * CLI commands for Bitbucket Data Center Markup Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { MarkupService } from '../../services/datacenter/markup.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterMarkupCommands {
  private static logger = Logger.forContext('DataCenterMarkupCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de markup');

    const markupCommand = program
      .command('markup')
      .description('Comandos de markup do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server markup <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Markup Rendering
    markupCommand
      .command('render')
      .description('Renderiza markup para HTML')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para renderizar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --type\`: Tipo de markup suportado (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)
- \`-c, --content\`: Conteúdo markup para renderizar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup render --type "MARKDOWN" --content "# Hello World"
  $ npx -y @guerchele/bitbucket-mcp-server markup render --type "TEXTILE" --content "h1. Hello World" --output json
  $ npx -y @guerchele/bitbucket-mcp-server markup render --type "ATLASSIAN_WIKI" --content "h1. Hello World"

**Descrição:**
  Renderiza conteúdo markup para HTML usando a API do Bitbucket Data Center.
  Suporta múltiplos tipos de markup incluindo Markdown, Textile, Confluence Wiki, etc.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.renderMarkup({
            type: options.type,
            markup: options.content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao renderizar markup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('preview')
      .description('Visualiza markup')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para visualizar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --type\`: Tipo de markup suportado (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)
- \`-c, --content\`: Conteúdo markup para visualizar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup preview --type "MARKDOWN" --content "# Hello World"
  $ npx -y @guerchele/bitbucket-mcp-server markup preview --type "TEXTILE" --content "h1. Hello World" --output json
  $ npx -y @guerchele/bitbucket-mcp-server markup preview --type "CONFLUENCE" --content "h1. Hello World"

**Descrição:**
  Visualiza como o markup será renderizado sem salvar o resultado.
  Útil para testar formatação antes de aplicar em documentos.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.previewMarkup({
            type: options.type,
            markup: options.content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao visualizar markup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('validate')
      .description('Valida markup')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para validar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --type\`: Tipo de markup suportado (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)
- \`-c, --content\`: Conteúdo markup para validar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup validate --type "MARKDOWN" --content "# Hello World"
  $ npx -y @guerchele/bitbucket-mcp-server markup validate --type "TEXTILE" --content "h1. Hello World" --output json
  $ npx -y @guerchele/bitbucket-mcp-server markup validate --type "ATLASSIAN_WIKI" --content "h1. Hello World"

**Descrição:**
  Valida se o markup está correto e bem formado.
  Retorna informações sobre erros, avisos e problemas de formatação encontrados.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.validateMarkup({
            type: options.type,
            markup: options.content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao validar markup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('get-supported-types')
      .description('Obtém tipos de markup suportados')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup get-supported-types
  $ npx -y @guerchele/bitbucket-mcp-server markup get-supported-types --output json

**Descrição:**
  Lista todos os tipos de markup suportados pelo Bitbucket Data Center.
  Inclui informações sobre cada tipo: nome, descrição e status de suporte.
  Tipos comuns: MARKDOWN, TEXTILE, ATLASSIAN_WIKI, CONFLUENCE, PLAIN, etc.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.getSupportedMarkupTypes();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter tipos de markup suportados', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // File-based operations
    markupCommand
      .command('render-file')
      .description('Renderiza markup de arquivo para HTML')
      .requiredOption('-f, --file <file>', 'Caminho do arquivo')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-f, --file\`: Caminho do arquivo contendo markup
- \`-t, --type\`: Tipo de markup suportado (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup render-file --file "README.md" --type "MARKDOWN"
  $ npx -y @guerchele/bitbucket-mcp-server markup render-file --file "documentation.textile" --type "TEXTILE" --output json
  $ npx -y @guerchele/bitbucket-mcp-server markup render-file --file "wiki.txt" --type "ATLASSIAN_WIKI"

**Descrição:**
  Renderiza conteúdo markup de um arquivo para HTML.
  Lê o arquivo do sistema de arquivos e processa o conteúdo usando a API do Bitbucket.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          // Read file content
          const fs = require('fs');
          const content = fs.readFileSync(options.file, 'utf8');

          const result = await markupService.renderMarkup({
            type: options.type,
            markup: content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao renderizar markup de arquivo', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('preview-file')
      .description('Visualiza markup de arquivo')
      .requiredOption('-f, --file <file>', 'Caminho do arquivo')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-f, --file\`: Caminho do arquivo contendo markup
- \`-t, --type\`: Tipo de markup suportado (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup preview-file --file "README.md" --type "MARKDOWN"
  $ npx -y @guerchele/bitbucket-mcp-server markup preview-file --file "documentation.textile" --type "TEXTILE" --output json
  $ npx -y @guerchele/bitbucket-mcp-server markup preview-file --file "wiki.txt" --type "ATLASSIAN_WIKI"

**Descrição:**
  Visualiza como o markup de um arquivo será renderizado.
  Lê o arquivo e mostra uma prévia sem salvar o resultado.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          // Read file content
          const fs = require('fs');
          const content = fs.readFileSync(options.file, 'utf8');

          const result = await markupService.previewMarkup({
            type: options.type,
            markup: content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao visualizar markup de arquivo', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('validate-file')
      .description('Valida markup de arquivo')
      .requiredOption('-f, --file <file>', 'Caminho do arquivo')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-f, --file\`: Caminho do arquivo contendo markup
- \`-t, --type\`: Tipo de markup suportado (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup validate-file --file "README.md" --type "MARKDOWN"
  $ npx -y @guerchele/bitbucket-mcp-server markup validate-file --file "documentation.textile" --type "TEXTILE" --output json
  $ npx -y @guerchele/bitbucket-mcp-server markup validate-file --file "wiki.txt" --type "ATLASSIAN_WIKI"

**Descrição:**
  Valida se o markup de um arquivo está correto e bem formado.
  Lê o arquivo e verifica erros de sintaxe, formatação e problemas de estrutura.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          // Read file content
          const fs = require('fs');
          const content = fs.readFileSync(options.file, 'utf8');

          const result = await markupService.validateMarkup({
            type: options.type,
            markup: content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao validar markup de arquivo', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Repository context operations
    markupCommand
      .command('render-repo')
      .description('Renderiza markup no contexto de um repositório')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para renderizar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto (ex: PROJ)
- \`-r, --repo\`: Slug do repositório (ex: my-repo)
- \`-t, --type\`: Tipo de markup suportado
- \`-c, --content\`: Conteúdo markup para renderizar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup render-repo --project "PROJ" --repo "my-repo" --type "MARKDOWN" --content "# Hello"
  $ npx -y @guerchele/bitbucket-mcp-server markup render-repo --project "DOCS" --repo "wiki" --type "TEXTILE" --content "h1. Title" --output json

**Descrição:**
  Renderiza markup no contexto de um repositório específico.
  Permite referências a arquivos e commits do repositório no markup.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.renderMarkupForRepository(
            options.project,
            options.repo,
            {
              type: options.type,
              markup: options.content,
            } as any
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao renderizar markup de repositório', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('preview-repo')
      .description('Visualiza markup no contexto de um repositório')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para visualizar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto (ex: PROJ)
- \`-r, --repo\`: Slug do repositório (ex: my-repo)
- \`-t, --type\`: Tipo de markup suportado
- \`-c, --content\`: Conteúdo markup para visualizar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup preview-repo --project "PROJ" --repo "my-repo" --type "MARKDOWN" --content "# Hello"
  $ npx -y @guerchele/bitbucket-mcp-server markup preview-repo --project "DOCS" --repo "wiki" --type "TEXTILE" --content "h1. Title" --output json

**Descrição:**
  Visualiza markup no contexto de um repositório específico.
  Mostra como o markup será renderizado com acesso ao contexto do repositório.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.previewMarkupForRepository(
            options.project,
            options.repo,
            {
              type: options.type,
              markup: options.content,
            } as any
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao visualizar markup de repositório', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('validate-repo')
      .description('Valida markup no contexto de um repositório')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para validar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto (ex: PROJ)
- \`-r, --repo\`: Slug do repositório (ex: my-repo)
- \`-t, --type\`: Tipo de markup suportado
- \`-c, --content\`: Conteúdo markup para validar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup validate-repo --project "PROJ" --repo "my-repo" --type "MARKDOWN" --content "# Hello"
  $ npx -y @guerchele/bitbucket-mcp-server markup validate-repo --project "DOCS" --repo "wiki" --type "TEXTILE" --content "h1. Title" --output json

**Descrição:**
  Valida markup no contexto de um repositório específico.
  Verifica erros considerando o contexto do repositório (arquivos, commits, etc.).`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.validateMarkupForRepository(
            options.project,
            options.repo,
            {
              type: options.type,
              markup: options.content,
            } as any
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao validar markup de repositório', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Project context operations
    markupCommand
      .command('render-project')
      .description('Renderiza markup no contexto de um projeto')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para renderizar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto (ex: PROJ)
- \`-t, --type\`: Tipo de markup suportado
- \`-c, --content\`: Conteúdo markup para renderizar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup render-project --project "PROJ" --type "MARKDOWN" --content "# Project Docs"
  $ npx -y @guerchele/bitbucket-mcp-server markup render-project --project "DOCS" --type "TEXTILE" --content "h1. Project Title" --output json

**Descrição:**
  Renderiza markup no contexto de um projeto específico.
  Permite referências a repositórios e recursos do projeto no markup.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.renderMarkupForProject(options.project, {
            type: options.type,
            markup: options.content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao renderizar markup de projeto', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('preview-project')
      .description('Visualiza markup no contexto de um projeto')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para visualizar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto (ex: PROJ)
- \`-t, --type\`: Tipo de markup suportado
- \`-c, --content\`: Conteúdo markup para visualizar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup preview-project --project "PROJ" --type "MARKDOWN" --content "# Project Docs"
  $ npx -y @guerchele/bitbucket-mcp-server markup preview-project --project "DOCS" --type "TEXTILE" --content "h1. Project Title" --output json

**Descrição:**
  Visualiza markup no contexto de um projeto específico.
  Mostra como o markup será renderizado com acesso ao contexto do projeto.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.previewMarkupForProject(options.project, {
            type: options.type,
            markup: options.content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao visualizar markup de projeto', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    markupCommand
      .command('validate-project')
      .description('Valida markup no contexto de um projeto')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption(
        '-t, --type <type>',
        'Tipo de markup (MARKDOWN, PLAIN, ATLASSIAN_WIKI, CONFLUENCE, TEXTILE, RST, ASCIIDOC, MEDIAWIKI, CREOLE, ORIGINAL)'
      )
      .requiredOption('-c, --content <content>', 'Conteúdo para validar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto (ex: PROJ)
- \`-t, --type\`: Tipo de markup suportado
- \`-c, --content\`: Conteúdo markup para validar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server markup validate-project --project "PROJ" --type "MARKDOWN" --content "# Project Docs"
  $ npx -y @guerchele/bitbucket-mcp-server markup validate-project --project "DOCS" --type "TEXTILE" --content "h1. Project Title" --output json

**Descrição:**
  Valida markup no contexto de um projeto específico.
  Verifica erros considerando o contexto do projeto (repositórios, recursos, etc.).`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const markupService = new MarkupService(apiClient, Logger.forContext('MarkupService'));

          const result = await markupService.validateMarkupForProject(options.project, {
            type: options.type,
            markup: options.content,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao validar markup de projeto', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center markup commands');
  }
}
