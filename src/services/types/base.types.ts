export interface McpResponse {
  content: Array<{
    type: 'text';
    text: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface ErrorResponse {
  content: Array<{
    type: 'text';
    text: string;
    [key: string]: unknown;
  }>;
  isError: true;
  [key: string]: unknown;
}

// Helper functions for creating MCP responses
export function createMcpResponse(
  data: any,
  output: 'markdown' | 'json' = 'markdown'
): McpResponse {
  let result: string;

  if (output === 'markdown') {
    result = objectToMarkdown(data);
  } else {
    result = JSON.stringify(data, null, 2);
  }

  return {
    content: [
      {
        type: 'text',
        text: result,
      },
    ],
  };
}

export function createErrorResponse(error: string): ErrorResponse {
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error}`,
      },
    ],
    isError: true,
  };
}

export function objectToMarkdown(data: any, depth: number = 0): string {
  if (data === null || data === undefined) {
    return 'null';
  }

  if (typeof data === 'string') {
    // Check if it's a URL and format as link
    if (isUrl(data)) {
      return `[${data}](${data})`;
    }
    return `"${data}"`;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '[]';
    }

    // For small arrays of primitives, use simple list
    if (
      data.length <= 5 &&
      data.every(
        item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
      )
    ) {
      return data.map(item => `- ${objectToMarkdown(item, depth + 1)}`).join('\n');
    }

    // For arrays of objects, try to create a table if they have similar structure
    if (data.length > 0 && data.every(item => typeof item === 'object' && item !== null)) {
      const tableResult = tryCreateTable(data);
      if (tableResult) {
        return tableResult;
      }
    }

    // For large arrays or complex objects, use numbered list with headers
    if (data.length > 3) {
      const items = data
        .map((item, index) => {
          const header = `### ${index + 1}`;
          const itemMarkdown = objectToMarkdown(item, depth + 1);
          return `${header}\n\n${itemMarkdown}`;
        })
        .join('\n\n');

      return items;
    }

    // Default array formatting for small arrays
    const items = data
      .map((item, index) => {
        const indent = '  '.repeat(depth + 1);
        const itemMarkdown = objectToMarkdown(item, depth + 1);
        return `${indent}- ${itemMarkdown}`;
      })
      .join('\n');

    return `[\n${items}\n${'  '.repeat(depth)}]`;
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return '{}';
    }

    // Check if this looks like a pagination response
    if (isPaginationResponse(data)) {
      return formatPaginationResponse(data);
    }

    // For regular objects, use cleaner formatting
    const properties = keys
      .map(key => {
        const value = objectToMarkdown(data[key], depth + 1);
        return `**${key}**: ${value}`;
      })
      .join('\n');

    return properties;
  }

  return String(data);
}

// Helper functions for better formatting
function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function isPaginationResponse(data: any): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data.size !== undefined || data.limit !== undefined) &&
    Array.isArray(data.values)
  );
}

function tryCreateTable(data: any[]): string | null {
  if (data.length === 0) return null;

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });

  const keys = Array.from(allKeys);

  // Only create table if we have a reasonable number of keys and items
  if (keys.length > 10 || keys.length === 0) return null;
  if (data.length > 50) return null; // Too many rows

  // Check if most objects have similar structure
  const hasConsistentStructure = data.every(
    item =>
      typeof item === 'object' &&
      item !== null &&
      keys.filter(key => key in item).length >= Math.max(1, keys.length * 0.5)
  );

  if (!hasConsistentStructure) return null;

  // Create table headers (use first few keys, prioritize common ones)
  const headers = keys.slice(0, 6).map(key => key.charAt(0).toUpperCase() + key.slice(1));

  // Create table rows
  const rows = data.map(item => {
    return headers.map(header => {
      const key = header.toLowerCase();
      const value = item[key];

      if (value === null || value === undefined) {
        return 'N/A';
      }

      if (typeof value === 'string') {
        // Truncate long strings
        return value.length > 50 ? value.substring(0, 47) + '...' : value;
      }

      if (typeof value === 'object') {
        // For nested objects, show a summary
        if (Array.isArray(value)) {
          return `${value.length} items`;
        }
        return `${Object.keys(value).length} properties`;
      }

      return String(value);
    });
  });

  // Create markdown table
  const tableHeader = `| ${headers.join(' | ')} |`;
  const tableSeparator = `| ${headers.map(() => '---').join(' | ')} |`;
  const tableRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');

  return `\n${tableHeader}\n${tableSeparator}\n${tableRows}\n`;
}

function formatPaginationResponse(data: any): string {
  const sections = [];

  // Summary section
  const summaryItems = [];
  if (data.size !== undefined) summaryItems.push(`**Total de itens**: ${data.size}`);
  if (data.limit !== undefined) summaryItems.push(`**Limite por página**: ${data.limit}`);
  if (data.isLastPage !== undefined)
    summaryItems.push(`**Última página**: ${data.isLastPage ? 'Sim' : 'Não'}`);
  if (data.start !== undefined) summaryItems.push(`**Posição inicial**: ${data.start}`);
  if (data.page !== undefined) summaryItems.push(`**Página atual**: ${data.page}`);
  if (data.next !== undefined) summaryItems.push(`**Próxima página**: ${data.next}`);

  if (summaryItems.length > 0) {
    sections.push(`## Resumo da Consulta\n\n${summaryItems.join('\n')}`);
  }

  // Values section
  if (data.values && data.values.length > 0) {
    const tableResult = tryCreateTable(data.values);
    if (tableResult) {
      sections.push(`## Resultados\n\n${tableResult}`);
    } else {
      sections.push(`## Resultados\n\n${objectToMarkdown(data.values, 0)}`);
    }
  }

  return sections.join('\n\n');
}
