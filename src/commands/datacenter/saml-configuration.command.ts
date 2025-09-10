/**
 * Data Center SAML Configuration Commands
 * CLI commands for Bitbucket Data Center SAML Configuration Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { SamlConfigurationService } from '../../services/datacenter/saml-configuration.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterSamlConfigurationCommands {
  private static logger = Logger.forContext('DataCenterSamlConfigurationCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de configuração SAML');

    const samlCommand = program
      .command('saml')
      .description('Comandos de configuração SAML do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server saml <command> --help' para mais informações sobre um comando específico.
      `
      );

    // SAML Configuration Management
    samlCommand
      .command('list-configurations')
      .description('Lista configurações SAML')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml list-configurations
  $ npx -y @guerchele/bitbucket-mcp-server saml list-configurations --output json

**Descrição:**
  Lista todas as configurações SAML configuradas no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.listSamlConfigurations();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar configurações SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    samlCommand
      .command('create-configuration')
      .description('Cria configuração SAML')
      .requiredOption('-n, --name <name>', 'Nome da configuração')
      .requiredOption('-e, --entity-id <entityId>', 'ID da entidade SAML')
      .requiredOption('-u, --sso-url <ssoUrl>', 'URL de SSO')
      .requiredOption('-c, --certificate <certificate>', 'Certificado SAML')
      .option('-d, --description <description>', 'Descrição da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome da configuração
- \`-e, --entity-id\`: ID da entidade SAML
- \`-u, --sso-url\`: URL de SSO
- \`-c, --certificate\`: Certificado SAML

**Opções disponíveis:**
- \`-d, --description\`: Descrição da configuração
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml create-configuration --name "My SAML Config" --entity-id "https://idp.example.com" --sso-url "https://idp.example.com/sso" --certificate "cert.pem"
  $ npx -y @guerchele/bitbucket-mcp-server saml create-configuration --name "Corporate SAML" --entity-id "https://corp.example.com" --sso-url "https://corp.example.com/sso" --certificate "corp-cert.pem" --description "Corporate SAML configuration"

**Descrição:**
  Cria uma nova configuração SAML para autenticação no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.createSamlConfiguration({
            name: options.name,
            entityId: options.entityId,
            ssoUrl: options.ssoUrl,
            certificate: options.certificate,
            description: options.description,
            attributeMapping: {
              username: 'username',
              email: 'email',
            },
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar configuração SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    samlCommand
      .command('get-configuration')
      .description('Obtém configuração SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml get-configuration --config-id 1
  $ npx -y @guerchele/bitbucket-mcp-server saml get-configuration --config-id 1 --output json

**Descrição:**
  Obtém detalhes de uma configuração SAML específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.getSamlConfiguration(parseInt(options.configId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configuração SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    samlCommand
      .command('update-configuration')
      .description('Atualiza configuração SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-n, --name <name>', 'Nome da configuração')
      .option('-e, --entity-id <entityId>', 'ID da entidade SAML')
      .option('-u, --sso-url <ssoUrl>', 'URL de SSO')
      .option('-c, --certificate <certificate>', 'Certificado SAML')
      .option('-d, --description <description>', 'Descrição da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-n, --name\`: Nome da configuração
- \`-e, --entity-id\`: ID da entidade SAML
- \`-u, --sso-url\`: URL de SSO
- \`-c, --certificate\`: Certificado SAML
- \`-d, --description\`: Descrição da configuração
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml update-configuration --config-id 1 --name "Updated SAML Config"
  $ npx -y @guerchele/bitbucket-mcp-server saml update-configuration --config-id 1 --description "Updated description" --output json

**Descrição:**
  Atualiza uma configuração SAML existente no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const updateData: any = {};
          if (options.name) updateData.name = options.name;
          if (options.entityId) updateData.entityId = options.entityId;
          if (options.ssoUrl) updateData.ssoUrl = options.ssoUrl;
          if (options.certificate) updateData.certificate = options.certificate;
          if (options.description) updateData.description = options.description;

          const result = await samlService.updateSamlConfiguration(
            parseInt(options.configId),
            updateData
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar configuração SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    samlCommand
      .command('delete-configuration')
      .description('Exclui configuração SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml delete-configuration --config-id 1
  $ npx -y @guerchele/bitbucket-mcp-server saml delete-configuration --config-id 1 --output json

**Descrição:**
  Exclui uma configuração SAML do Bitbucket Data Center. Esta ação é irreversível.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          await samlService.deleteSamlConfiguration(parseInt(options.configId));
          const response = createMcpResponse(
            { message: 'Configuração SAML excluída com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir configuração SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // SAML Certificate Management
    samlCommand
      .command('list-certificates')
      .description('Lista certificados SAML')
      .option('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-i, --config-id\`: ID da configuração (opcional)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml list-certificates
  $ npx -y @guerchele/bitbucket-mcp-server saml list-certificates --config-id 1
  $ npx -y @guerchele/bitbucket-mcp-server saml list-certificates --output json

**Descrição:**
  Lista certificados SAML associados a uma configuração no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.getSamlCertificate(options.configId || 'default');
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar certificados SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    samlCommand
      .command('add-certificate')
      .description('Adiciona certificado SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .requiredOption('-c, --certificate <certificate>', 'Certificado SAML')
      .option('-n, --name <name>', 'Nome do certificado')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração
- \`-c, --certificate\`: Certificado SAML

**Opções disponíveis:**
- \`-n, --name\`: Nome do certificado
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml add-certificate --config-id 1 --certificate "cert.pem"
  $ npx -y @guerchele/bitbucket-mcp-server saml add-certificate --config-id 1 --certificate "cert.pem" --name "My Certificate"

**Descrição:**
  Adiciona um novo certificado SAML a uma configuração no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.uploadSamlCertificate({
            certificate: options.certificate,
            name: options.name,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao adicionar certificado SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    samlCommand
      .command('remove-certificate')
      .description('Remove certificado SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .requiredOption('-c, --certificate-id <certificateId>', 'ID do certificado')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração
- \`-c, --certificate-id\`: ID do certificado

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml remove-certificate --config-id 1 --certificate-id 123
  $ npx -y @guerchele/bitbucket-mcp-server saml remove-certificate --config-id 1 --certificate-id 123 --output json

**Descrição:**
  Remove um certificado SAML de uma configuração no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          await samlService.deleteSamlCertificate(options.certificateId);
          const response = createMcpResponse(
            { message: 'Certificado SAML removido com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao remover certificado SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // SAML Testing
    samlCommand
      .command('test-configuration')
      .description('Testa configuração SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml test-configuration --config-id 1
  $ npx -y @guerchele/bitbucket-mcp-server saml test-configuration --config-id 1 --output json

**Descrição:**
  Testa uma configuração SAML para verificar se está funcionando corretamente no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          // Primeiro obtém a configuração para usar seus dados no teste
          const config = await samlService.getSamlConfiguration(parseInt(options.configId));
          const result = await samlService.testSamlConfiguration({
            entityId: config.entityId,
            ssoUrl: config.ssoUrl,
            sloUrl: config.sloUrl,
            certificate: {
              data: config.certificate.fingerprint, // Usando fingerprint como proxy
            },
            attributeMapping: config.attributeMapping,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao testar configuração SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // SAML Metadata
    samlCommand
      .command('get-metadata')
      .description('Obtém metadados SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml get-metadata --config-id 1
  $ npx -y @guerchele/bitbucket-mcp-server saml get-metadata --config-id 1 --output json

**Descrição:**
  Obtém os metadados SAML de uma configuração no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.getSamlMetadata();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter metadados SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // SAML User Mapping
    samlCommand
      .command('get-user-mapping')
      .description('Obtém mapeamento de usuários SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml get-user-mapping --config-id 1
  $ npx -y @guerchele/bitbucket-mcp-server saml get-user-mapping --config-id 1 --output json

**Descrição:**
  Obtém o mapeamento de usuários SAML de uma configuração no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.getSamlUserMapping(options.configId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter mapeamento de usuários SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    samlCommand
      .command('update-user-mapping')
      .description('Atualiza mapeamento de usuários SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .requiredOption('-m, --mapping <mapping>', 'Mapeamento de usuários (JSON)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração
- \`-m, --mapping\`: Mapeamento de usuários (JSON)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml update-user-mapping --config-id 1 --mapping '{"username": "uid", "email": "mail"}'
  $ npx -y @guerchele/bitbucket-mcp-server saml update-user-mapping --config-id 1 --mapping '{"username": "uid", "email": "mail"}' --output json

**Descrição:**
  Atualiza o mapeamento de usuários SAML de uma configuração no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.getSamlUserMapping(options.configId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar mapeamento de usuários SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // SAML Group Mapping
    samlCommand
      .command('get-group-mapping')
      .description('Obtém mapeamento de grupos SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml get-group-mapping --config-id 1
  $ npx -y @guerchele/bitbucket-mcp-server saml get-group-mapping --config-id 1 --output json

**Descrição:**
  Obtém o mapeamento de grupos SAML de uma configuração no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.getSamlGroupMapping(options.configId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter mapeamento de grupos SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    samlCommand
      .command('update-group-mapping')
      .description('Atualiza mapeamento de grupos SAML')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .requiredOption('-m, --mapping <mapping>', 'Mapeamento de grupos (JSON)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração
- \`-m, --mapping\`: Mapeamento de grupos (JSON)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server saml update-group-mapping --config-id 1 --mapping '{"group": "memberOf", "admin": "adminGroup"}'
  $ npx -y @guerchele/bitbucket-mcp-server saml update-group-mapping --config-id 1 --mapping '{"group": "memberOf", "admin": "adminGroup"}' --output json

**Descrição:**
  Atualiza o mapeamento de grupos SAML de uma configuração no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const samlService = new SamlConfigurationService(
            apiClient,
            Logger.forContext('SamlConfigurationService')
          );

          const result = await samlService.getSamlGroupMapping(options.configId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar mapeamento de grupos SAML', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center SAML configuration commands');
  }
}
