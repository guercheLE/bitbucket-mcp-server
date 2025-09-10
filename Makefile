# Makefile for Bitbucket MCP Server

# Variables
NODE_VERSION := 18
PACKAGE_NAME := @guerchele/bitbucket-mcp-server
VERSION := 2.1.3

# Default target
.DEFAULT_GOAL := help

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help install build test clean lint format docker-build docker-run docker-stop

## Help
help: ## Show this help message
	@echo "$(BLUE)Bitbucket MCP Server$(NC)"
	@echo "$(YELLOW)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

## Development
install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install

build: ## Build the project
	@echo "$(BLUE)Building project...$(NC)"
	npm run build

dev: ## Start development mode
	@echo "$(BLUE)Starting development mode...$(NC)"
	npm run dev

start: ## Start the server
	@echo "$(BLUE)Starting server...$(NC)"
	npm start

## Testing
test: ## Run tests
	@echo "$(BLUE)Running tests...$(NC)"
	npm test

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test:coverage

## Code Quality
lint: ## Run linter
	@echo "$(BLUE)Running linter...$(NC)"
	npm run lint

lint-fix: ## Fix linting issues
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	npm run lint:fix

format: ## Format code
	@echo "$(BLUE)Formatting code...$(NC)"
	npm run format

## MCP Server
mcp-stdio: ## Start MCP server in STDIO mode
	@echo "$(BLUE)Starting MCP server in STDIO mode...$(NC)"
	npm run mcp:stdio

mcp-http: ## Start MCP server in HTTP mode
	@echo "$(BLUE)Starting MCP server in HTTP mode...$(NC)"
	npm run mcp:http

mcp-inspect: ## Start MCP server with inspector
	@echo "$(BLUE)Starting MCP server with inspector...$(NC)"
	npm run mcp:inspect

## Docker
docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t $(PACKAGE_NAME):$(VERSION) .
	docker tag $(PACKAGE_NAME):$(VERSION) $(PACKAGE_NAME):latest

docker-run: ## Run Docker container
	@echo "$(BLUE)Running Docker container...$(NC)"
	docker run -d \
		--name bitbucket-mcp-server \
		-p 3000:3000 \
		-e TRANSPORT_MODE=http \
		-e PORT=3000 \
		$(PACKAGE_NAME):latest

docker-stop: ## Stop Docker container
	@echo "$(BLUE)Stopping Docker container...$(NC)"
	docker stop bitbucket-mcp-server || true
	docker rm bitbucket-mcp-server || true

docker-compose-up: ## Start with Docker Compose
	@echo "$(BLUE)Starting with Docker Compose...$(NC)"
	docker-compose up -d

docker-compose-down: ## Stop Docker Compose
	@echo "$(BLUE)Stopping Docker Compose...$(NC)"
	docker-compose down

## Utilities
clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	npm run clean
	rm -rf dist/ coverage/ node_modules/

clean-docker: ## Clean Docker images and containers
	@echo "$(BLUE)Cleaning Docker...$(NC)"
	docker stop bitbucket-mcp-server || true
	docker rm bitbucket-mcp-server || true
	docker rmi $(PACKAGE_NAME):$(VERSION) || true
	docker rmi $(PACKAGE_NAME):latest || true

## Release
release: ## Create a new release
	@echo "$(BLUE)Creating new release...$(NC)"
	npx semantic-release

## Setup
setup: install build ## Setup the project (install + build)
	@echo "$(GREEN)Setup complete!$(NC)"

setup-dev: setup ## Setup development environment
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@echo "$(GREEN)Development setup complete!$(NC)"

## Health Check
health: ## Check server health
	@echo "$(BLUE)Checking server health...$(NC)"
	@if curl -s http://localhost:3000/ > /dev/null; then \
		echo "$(GREEN)Server is healthy$(NC)"; \
	else \
		echo "$(RED)Server is not responding$(NC)"; \
	fi

## Status
status: ## Show project status
	@echo "$(BLUE)Project Status:$(NC)"
	@echo "  Node.js: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "  npm: $(shell npm --version 2>/dev/null || echo 'Not installed')"
	@echo "  Docker: $(shell docker --version 2>/dev/null || echo 'Not installed')"
	@echo "  Build: $(shell test -d dist && echo 'Built' || echo 'Not built')"
	@echo "  Dependencies: $(shell test -d node_modules && echo 'Installed' || echo 'Not installed')"

## Quick Commands
quick-test: build test ## Quick test (build + test)
quick-dev: build dev ## Quick development (build + dev)
quick-start: build start ## Quick start (build + start)