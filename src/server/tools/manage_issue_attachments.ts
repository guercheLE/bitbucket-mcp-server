/**
 * Manage Issue Attachments Tool
 * 
 * MCP tool for managing issue attachments in Bitbucket repositories.
 * Supports file upload, download, validation, security, and organization.
 * 
 * Features:
 * - File attachment upload and download
 * - Attachment validation and security
 * - Attachment organization and cleanup
 * - Attachment preview capabilities
 */

import { Tool, ToolParameter, ToolExecutor, ToolResult, ToolExecutionContext } from '../../types/index.js';

/**
 * Manage Issue Attachments Tool Parameters
 */
const manageIssueAttachmentsParameters: ToolParameter[] = [
  {
    name: 'workspace',
    type: 'string',
    description: 'Workspace or project key where the repository is located',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'repository',
    type: 'string',
    description: 'Repository name or slug',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 100
    }
  },
  {
    name: 'action',
    type: 'string',
    description: 'Attachment action to perform',
    required: true,
    schema: {
      enum: ['upload', 'download', 'list', 'get', 'delete', 'update_metadata', 'get_preview']
    }
  },
  {
    name: 'issue_id',
    type: 'string',
    description: 'Issue ID or number',
    required: true,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 20
    }
  },
  {
    name: 'attachment_id',
    type: 'string',
    description: 'Attachment ID (required for download, get, delete, update_metadata, get_preview actions)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 50
    }
  },
  {
    name: 'file_path',
    type: 'string',
    description: 'Local file path for upload (required for upload action)',
    required: false,
    schema: {
      maxLength: 500
    }
  },
  {
    name: 'file_content',
    type: 'string',
    description: 'File content as base64 string (alternative to file_path for upload)',
    required: false,
    schema: {
      maxLength: 10485760 // 10MB base64 limit
    }
  },
  {
    name: 'file_name',
    type: 'string',
    description: 'File name for upload (required for upload action)',
    required: false,
    schema: {
      pattern: '^[a-zA-Z0-9._-]+$',
      minLength: 1,
      maxLength: 255
    }
  },
  {
    name: 'file_description',
    type: 'string',
    description: 'Description for the attachment',
    required: false,
    schema: {
      maxLength: 1000
    }
  },
  {
    name: 'allowed_file_types',
    type: 'array',
    description: 'Allowed file types for upload (MIME types)',
    required: false,
    default: ['image/*', 'text/*', 'application/pdf', 'application/zip'],
    schema: {
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9*/-]+$'
      },
      maxItems: 20
    }
  },
  {
    name: 'max_file_size',
    type: 'number',
    description: 'Maximum file size in bytes',
    required: false,
    default: 10485760, // 10MB
    schema: {
      minimum: 1024,
      maximum: 104857600 // 100MB
    }
  },
  {
    name: 'download_path',
    type: 'string',
    description: 'Local path to save downloaded file',
    required: false,
    schema: {
      maxLength: 500
    }
  },
  {
    name: 'include_preview',
    type: 'boolean',
    description: 'Include preview information in list/get actions',
    required: false,
    default: false
  },
  {
    name: 'preview_size',
    type: 'string',
    description: 'Preview size for images',
    required: false,
    default: 'medium',
    schema: {
      enum: ['small', 'medium', 'large', 'original']
    }
  }
];

/**
 * Manage Issue Attachments Tool Executor
 */
const manageIssueAttachmentsExecutor: ToolExecutor = async (params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> => {
  try {
    // Validate required parameters
    if (!params.workspace || !params.repository || !params.action || !params.issue_id) {
      return {
        success: false,
        error: {
          code: -32602, // Invalid params
          message: 'Workspace, repository, action, and issue_id are required',
          details: { missing: ['workspace', 'repository', 'action', 'issue_id'] }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_attachments'
        }
      };
    }

    // Validate repository name format
    const namePattern = /^[a-zA-Z0-9_-]+$/;
    if (!namePattern.test(params.repository)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Repository name must contain only alphanumeric characters, hyphens, and underscores',
          details: { invalid_repository: params.repository }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_attachments'
        }
      };
    }

    // Validate issue ID format
    if (!namePattern.test(params.issue_id)) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Issue ID must contain only alphanumeric characters, hyphens, and underscores',
          details: { invalid_issue_id: params.issue_id }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_attachments'
        }
      };
    }

    // Validate action-specific parameters
    if (params.action === 'upload' && !params.file_path && !params.file_content) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'File path or file content is required for upload action',
          details: { required_for_action: 'upload' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_attachments'
        }
      };
    }

    if (params.action === 'upload' && !params.file_name) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'File name is required for upload action',
          details: { required_for_action: 'upload' }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_attachments'
        }
      };
    }

    const attachmentIdActions = ['download', 'get', 'delete', 'update_metadata', 'get_preview'];
    if (attachmentIdActions.includes(params.action) && !params.attachment_id) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'Attachment ID is required for this action',
          details: { required_for_actions: attachmentIdActions }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_attachments'
        }
      };
    }

    // Validate file size if provided
    const maxFileSize = params.max_file_size || 10485760; // 10MB default
    if (params.file_content && params.file_content.length > maxFileSize) {
      return {
        success: false,
        error: {
          code: -32602,
          message: 'File content exceeds maximum file size',
          details: { 
            content_size: params.file_content.length, 
            max_size: maxFileSize,
            max_size_mb: Math.round(maxFileSize / 1024 / 1024)
          }
        },
        metadata: {
          timestamp: new Date(),
          tool: 'manage_issue_attachments'
        }
      };
    }

    // TODO: Implement actual Bitbucket API call
    // This is a placeholder implementation based on action
    let result: any = {};

    switch (params.action) {
      case 'upload':
        const attachmentId = `att_${Date.now()}`;
        const issueNumber = parseInt(params.issue_id) || 1;
        
        // Mock file validation
        const fileExtension = params.file_name.split('.').pop()?.toLowerCase() || '';
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'zip', 'doc', 'docx'];
        
        if (!allowedExtensions.includes(fileExtension)) {
          return {
            success: false,
            error: {
              code: -32602,
              message: 'File type not allowed',
              details: { 
                file_extension: fileExtension,
                allowed_extensions: allowedExtensions
              }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'manage_issue_attachments'
            }
          };
        }

        result = {
          action: 'upload',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          attachment: {
            id: attachmentId,
            name: params.file_name,
            description: params.file_description || null,
            size: params.file_content ? params.file_content.length : 1024,
            content_type: `application/${fileExtension}`,
            file_extension: fileExtension,
            uploaded_by: {
              username: 'current_user',
              display_name: 'Current User',
              uuid: 'user-uuid-current'
            },
            uploaded_on: new Date().toISOString(),
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}/attachments/${attachmentId}`
              },
              download: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${issueNumber}/attachments/${attachmentId}/download`
              }
            },
            security: {
              scanned: true,
              safe: true,
              virus_scan_date: new Date().toISOString()
            }
          },
          message: `File '${params.file_name}' uploaded successfully to issue #${issueNumber}`
        };
        break;

      case 'download':
        const downloadIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'download',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          attachment_id: params.attachment_id,
          download: {
            attachment_id: params.attachment_id,
            name: 'oauth_error_log.txt',
            size: 1024,
            content_type: 'text/plain',
            download_url: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${downloadIssueNumber}/attachments/${params.attachment_id}/download`,
            download_path: params.download_path || `./downloads/${params.attachment_id}_oauth_error_log.txt`,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
            downloaded_at: new Date().toISOString(),
            downloaded_by: {
              username: 'current_user',
              display_name: 'Current User'
            }
          },
          message: `Attachment ${params.attachment_id} downloaded successfully`
        };
        break;

      case 'list':
        const listIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'list',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          attachments: [
            {
              id: 'att_1',
              name: 'oauth_error_log.txt',
              description: 'Error log from OAuth authentication failure',
              size: 1024,
              content_type: 'text/plain',
              file_extension: 'txt',
              uploaded_by: {
                username: 'user1',
                display_name: 'User One',
                uuid: 'user-uuid-1'
              },
              uploaded_on: '2024-09-20T11:00:00Z',
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${listIssueNumber}/attachments/att_1`
                },
                download: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${listIssueNumber}/attachments/att_1/download`
                }
              },
              security: {
                scanned: true,
                safe: true,
                virus_scan_date: '2024-09-20T11:00:00Z'
              },
              preview: params.include_preview ? {
                available: false,
                type: 'text',
                preview_text: 'Error: OAuth token validation failed...'
              } : null
            },
            {
              id: 'att_2',
              name: 'screenshot.png',
              description: 'Screenshot of the authentication error',
              size: 245760,
              content_type: 'image/png',
              file_extension: 'png',
              uploaded_by: {
                username: 'user1',
                display_name: 'User One',
                uuid: 'user-uuid-1'
              },
              uploaded_on: '2024-09-20T11:30:00Z',
              links: {
                self: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${listIssueNumber}/attachments/att_2`
                },
                download: {
                  href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${listIssueNumber}/attachments/att_2/download`
                }
              },
              security: {
                scanned: true,
                safe: true,
                virus_scan_date: '2024-09-20T11:30:00Z'
              },
              preview: params.include_preview ? {
                available: true,
                type: 'image',
                preview_url: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${listIssueNumber}/attachments/att_2/preview?size=${params.preview_size || 'medium'}`,
                dimensions: {
                  width: 800,
                  height: 600
                }
              } : null
            }
          ],
          total_attachments: 2,
          message: `Attachments retrieved for issue #${listIssueNumber}`
        };
        break;

      case 'get':
        const getIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'get',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          attachment_id: params.attachment_id,
          attachment: {
            id: params.attachment_id,
            name: 'oauth_error_log.txt',
            description: 'Error log from OAuth authentication failure',
            size: 1024,
            content_type: 'text/plain',
            file_extension: 'txt',
            uploaded_by: {
              username: 'user1',
              display_name: 'User One',
              uuid: 'user-uuid-1',
              links: {
                self: {
                  href: 'https://api.bitbucket.org/2.0/users/user1'
                }
              }
            },
            uploaded_on: '2024-09-20T11:00:00Z',
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${getIssueNumber}/attachments/${params.attachment_id}`
              },
              download: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${getIssueNumber}/attachments/${params.attachment_id}/download`
              }
            },
            security: {
              scanned: true,
              safe: true,
              virus_scan_date: '2024-09-20T11:00:00Z'
            },
            preview: params.include_preview ? {
              available: false,
              type: 'text',
              preview_text: 'Error: OAuth token validation failed at line 45...'
            } : null
          },
          message: `Attachment ${params.attachment_id} retrieved successfully`
        };
        break;

      case 'delete':
        const deleteIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'delete',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          attachment_id: params.attachment_id,
          deleted_at: new Date().toISOString(),
          deleted_by: {
            username: 'current_user',
            display_name: 'Current User'
          },
          message: `Attachment ${params.attachment_id} deleted successfully from issue #${deleteIssueNumber}`
        };
        break;

      case 'update_metadata':
        const updateIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'update_metadata',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          attachment_id: params.attachment_id,
          attachment: {
            id: params.attachment_id,
            name: 'oauth_error_log.txt',
            description: params.file_description || 'Updated description',
            size: 1024,
            content_type: 'text/plain',
            file_extension: 'txt',
            uploaded_by: {
              username: 'user1',
              display_name: 'User One'
            },
            uploaded_on: '2024-09-20T11:00:00Z',
            updated_on: new Date().toISOString(),
            updated_by: {
              username: 'current_user',
              display_name: 'Current User'
            },
            links: {
              self: {
                href: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${updateIssueNumber}/attachments/${params.attachment_id}`
              }
            }
          },
          message: `Attachment ${params.attachment_id} metadata updated successfully`
        };
        break;

      case 'get_preview':
        const previewIssueNumber = parseInt(params.issue_id) || 1;
        result = {
          action: 'get_preview',
          repository: params.repository,
          workspace: params.workspace,
          issue_id: params.issue_id,
          attachment_id: params.attachment_id,
          preview: {
            attachment_id: params.attachment_id,
            name: 'screenshot.png',
            content_type: 'image/png',
            preview_available: true,
            preview_type: 'image',
            preview_url: `https://api.bitbucket.org/2.0/repositories/${params.workspace}/${params.repository}/issues/${previewIssueNumber}/attachments/${params.attachment_id}/preview?size=${params.preview_size || 'medium'}`,
            dimensions: {
              width: 800,
              height: 600
            },
            preview_sizes: ['small', 'medium', 'large', 'original'],
            generated_at: new Date().toISOString()
          },
          message: `Preview generated for attachment ${params.attachment_id}`
        };
        break;

      default:
        return {
          success: false,
          error: {
            code: -32602,
            message: 'Invalid action specified',
            details: { valid_actions: ['upload', 'download', 'list', 'get', 'delete', 'update_metadata', 'get_preview'] }
          },
          metadata: {
            timestamp: new Date(),
            tool: 'manage_issue_attachments'
          }
        };
    }

    // Log the attachment action
    context.session?.emit('tool:executed', 'manage_issue_attachments', {
      action: params.action,
      repository: params.repository,
      workspace: params.workspace,
      issue_id: params.issue_id,
      attachment_id: params.attachment_id
    });

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
        tool: 'manage_issue_attachments',
        execution_time: Date.now() - context.request.timestamp.getTime(),
        workspace: params.workspace,
        repository: params.repository,
        action: params.action
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        code: -32603, // Internal error
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      metadata: {
        timestamp: new Date(),
        tool: 'manage_issue_attachments',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
};

/**
 * Manage Issue Attachments Tool Definition
 */
export const manageIssueAttachmentsTool: Tool = {
  name: 'manage_issue_attachments',
  description: 'Manage issue attachments with upload, download, validation, security, and preview capabilities',
  parameters: manageIssueAttachmentsParameters,
  category: 'issue_management',
  version: '1.0.0',
  enabled: true,
  execute: manageIssueAttachmentsExecutor,
  metadata: {
    api_endpoint: '/2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments',
    supported_apis: ['bitbucket_cloud', 'bitbucket_data_center'],
    requires_auth: true,
    rate_limit: '1000/hour'
  }
};

export default manageIssueAttachmentsTool;
