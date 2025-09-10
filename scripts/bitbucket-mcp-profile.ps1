# Bitbucket MCP Server - PowerShell Profile
# Adicione este arquivo ao seu perfil PowerShell para ter acesso fácil aos comandos
# 
# Para carregar: . .\scripts\bitbucket-mcp-server-profile.ps1
# Para carregar automaticamente, adicione ao seu $PROFILE

# Aliases para comandos comuns
Set-Alias -Name bmcp -Value "npx @guerchele/bitbucket-mcp-server"

# Função para executar comandos CLI diretamente
function Invoke-BitbucketMCP {
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Command,
        [string[]]$Arguments
    )
    
    $allArgs = @($Command) + $Arguments
    npx @guerchele/bitbucket-mcp-server $allArgs
}

# Função para listar workspaces
function Get-BitbucketWorkspaces {
    param([switch]$Debug)
    $args = @("ls-workspaces")
    if ($Debug) { $args += "--debug" }
    npx @guerchele/bitbucket-mcp-server $args
}

# Função para listar repositórios
function Get-BitbucketRepos {
    param(
        [Parameter(Mandatory=$true)]
        [string]$WorkspaceSlug,
        [switch]$Debug
    )
    $args = @("ls-repos", "--workspace-slug", $WorkspaceSlug)
    if ($Debug) { $args += "--debug" }
    npx @guerchele/bitbucket-mcp-server $args
}

# Função para listar pull requests
function Get-BitbucketPRs {
    param(
        [Parameter(Mandatory=$true)]
        [string]$WorkspaceSlug,
        [Parameter(Mandatory=$true)]
        [string]$RepoSlug,
        [switch]$Debug
    )
    $args = @("ls-prs", "--workspace-slug", $WorkspaceSlug, "--repo-slug", $RepoSlug)
    if ($Debug) { $args += "--debug" }
    npx @guerchele/bitbucket-mcp-server $args
}

# Função para listar issues
function Get-BitbucketIssues {
    param(
        [Parameter(Mandatory=$true)]
        [string]$WorkspaceSlug,
        [Parameter(Mandatory=$true)]
        [string]$RepoSlug,
        [switch]$Debug
    )
    $args = @("ls-issues", "--workspace-slug", $WorkspaceSlug, "--repo-slug", $RepoSlug)
    if ($Debug) { $args += "--debug" }
    npx @guerchele/bitbucket-mcp-server $args
}

# Função para buscar código
function Search-BitbucketCode {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Query,
        [string]$WorkspaceSlug,
        [string]$RepoSlug,
        [switch]$Debug
    )
    $args = @("search-code", $Query)
    if ($WorkspaceSlug) { $args += "--workspace-slug", $WorkspaceSlug }
    if ($RepoSlug) { $args += "--repo-slug", $RepoSlug }
    if ($Debug) { $args += "--debug" }
    npx @guerchele/bitbucket-mcp-server $args
}

# Função para mostrar configuração
function Get-BitbucketConfig {
    param([switch]$Debug)
    $args = @("config")
    if ($Debug) { $args += "--debug" }
    npx @guerchele/bitbucket-mcp-server $args
}

# Função para testar conexão
function Test-BitbucketConnection {
    param([switch]$Debug)
    $args = @("test-connection")
    if ($Debug) { $args += "--debug" }
    npx @guerchele/bitbucket-mcp-server $args
}

# Função para iniciar servidor MCP
function Start-BitbucketMCPServer {
    param(
        [ValidateSet("stdio", "http")]
        [string]$TransportMode = "stdio",
        [switch]$Debug
    )
    $env:TRANSPORT_MODE = $TransportMode
    if ($Debug) { $env:DEBUG = "true" }
    
    Write-Host "Iniciando servidor MCP em modo $TransportMode..." -ForegroundColor Yellow
    npx @guerchele/bitbucket-mcp-server
}

# Função para mostrar ajuda
function Show-BitbucketHelp {
    Write-Host @"
Bitbucket MCP Server - PowerShell Profile

Aliases disponíveis:
  bmcp                    - Acesso direto ao CLI
  
Funções disponíveis:
  Invoke-BitbucketMCP     - Executar comandos CLI diretamente
  Get-BitbucketWorkspaces - Listar workspaces
  Get-BitbucketRepos      - Listar repositórios
  Get-BitbucketPRs        - Listar pull requests
  Get-BitbucketIssues     - Listar issues
  Search-BitbucketCode    - Buscar código
  Get-BitbucketConfig     - Mostrar configuração
  Test-BitbucketConnection - Testar conexão
  Start-BitbucketMCPServer - Executar servidor MCP
  
Exemplos:
  # Comandos CLI diretos
  Invoke-BitbucketMCP "ls-workspaces"
  Invoke-BitbucketMCP "ls-repos" "--workspace-slug", "meu-workspace"
  
  # Funções PowerShell
  Get-BitbucketWorkspaces
  Get-BitbucketRepos -WorkspaceSlug "meu-workspace"
  Get-BitbucketPRs -WorkspaceSlug "meu-workspace" -RepoSlug "meu-repo"
  Start-BitbucketMCPServer -TransportMode "http" -Debug
  
  # Alias direto
  bmcp --help
"@ -ForegroundColor Cyan
}

# Exportar funções para uso global
Export-ModuleMember -Function @(
    'Invoke-BitbucketMCP',
    'Get-BitbucketWorkspaces',
    'Get-BitbucketRepos',
    'Get-BitbucketPRs',
    'Get-BitbucketIssues',
    'Search-BitbucketCode',
    'Get-BitbucketConfig',
    'Test-BitbucketConnection',
    'Start-BitbucketMCPServer',
    'Show-BitbucketHelp'
)

Write-Host "Bitbucket MCP Server PowerShell Profile carregado!" -ForegroundColor Green
Write-Host "Use 'Show-BitbucketHelp' para ver comandos disponíveis" -ForegroundColor Yellow
