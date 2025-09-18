import { z } from 'zod';

// Schemas de validação para usuário atual (Data Center)
const UserResponseSchema = z.object({
  name: z.string().min(1, 'name é obrigatório'),
  emailAddress: z.string().email('emailAddress deve ser um email válido'),
  id: z.number().int().positive('id deve ser um número inteiro positivo'),
  displayName: z.string().min(1, 'displayName é obrigatório'),
  slug: z.string().min(1, 'slug é obrigatório'),
  type: z.literal('NORMAL'),
  active: z.boolean(),
  links: z.object({
    self: z.array(z.object({
      href: z.string().url('href deve ser uma URL válida')
    }))
  })
});

// Schemas de validação para usuário atual (Cloud)
const CloudUserResponseSchema = z.object({
  uuid: z.string().uuid('uuid deve ser um UUID válido'),
  username: z.string().min(1, 'username é obrigatório'),
  display_name: z.string().min(1, 'display_name é obrigatório'),
  account_id: z.string().min(1, 'account_id é obrigatório'),
  account_status: z.enum(['active', 'inactive']),
  email: z.string().email('email deve ser um email válido'),
  created_on: z.string().datetime('created_on deve ser uma data ISO válida'),
  has_2fa_enabled: z.boolean(),
  links: z.object({
    self: z.object({
      href: z.string().url('href deve ser uma URL válida')
    }),
    avatar: z.object({
      href: z.string().url('href deve ser uma URL válida')
    })
  })
});

describe('Current User Contract Tests', () => {
  describe('UserResponse (Data Center) validation', () => {
    it('deve validar response válido do Data Center', () => {
      const validResponse = {
        name: 'john.doe',
        emailAddress: 'john.doe@example.com',
        id: 12345,
        displayName: 'John Doe',
        slug: 'john-doe',
        type: 'NORMAL' as const,
        active: true,
        links: {
          self: [{
            href: 'https://bitbucket.example.com/users/john.doe'
          }]
        }
      };

      expect(() => UserResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve rejeitar response sem name', () => {
      const invalidResponse = {
        emailAddress: 'john.doe@example.com',
        id: 12345,
        displayName: 'John Doe',
        slug: 'john-doe',
        type: 'NORMAL' as const,
        active: true,
        links: {
          self: [{
            href: 'https://bitbucket.example.com/users/john.doe'
          }]
        }
      };

      expect(() => UserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar emailAddress inválido', () => {
      const invalidResponse = {
        name: 'john.doe',
        emailAddress: 'invalid-email',
        id: 12345,
        displayName: 'John Doe',
        slug: 'john-doe',
        type: 'NORMAL' as const,
        active: true,
        links: {
          self: [{
            href: 'https://bitbucket.example.com/users/john.doe'
          }]
        }
      };

      expect(() => UserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar id negativo', () => {
      const invalidResponse = {
        name: 'john.doe',
        emailAddress: 'john.doe@example.com',
        id: -1,
        displayName: 'John Doe',
        slug: 'john-doe',
        type: 'NORMAL' as const,
        active: true,
        links: {
          self: [{
            href: 'https://bitbucket.example.com/users/john.doe'
          }]
        }
      };

      expect(() => UserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar type diferente de NORMAL', () => {
      const invalidResponse = {
        name: 'john.doe',
        emailAddress: 'john.doe@example.com',
        id: 12345,
        displayName: 'John Doe',
        slug: 'john-doe',
        type: 'ADMIN' as any,
        active: true,
        links: {
          self: [{
            href: 'https://bitbucket.example.com/users/john.doe'
          }]
        }
      };

      expect(() => UserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar links.self com href inválida', () => {
      const invalidResponse = {
        name: 'john.doe',
        emailAddress: 'john.doe@example.com',
        id: 12345,
        displayName: 'John Doe',
        slug: 'john-doe',
        type: 'NORMAL' as const,
        active: true,
        links: {
          self: [{
            href: 'invalid-url'
          }]
        }
      };

      expect(() => UserResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('CloudUserResponse (Cloud) validation', () => {
    it('deve validar response válido do Cloud', () => {
      const validResponse = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: 'john.doe',
        display_name: 'John Doe',
        account_id: '12345',
        account_status: 'active' as const,
        email: 'john.doe@example.com',
        created_on: '2023-01-01T00:00:00.000Z',
        has_2fa_enabled: false,
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/users/john.doe'
          },
          avatar: {
            href: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/JD-5.png'
          }
        }
      };

      expect(() => CloudUserResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve rejeitar uuid inválido', () => {
      const invalidResponse = {
        uuid: 'invalid-uuid',
        username: 'john.doe',
        display_name: 'John Doe',
        account_id: '12345',
        account_status: 'active' as const,
        email: 'john.doe@example.com',
        created_on: '2023-01-01T00:00:00.000Z',
        has_2fa_enabled: false,
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/users/john.doe'
          },
          avatar: {
            href: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/JD-5.png'
          }
        }
      };

      expect(() => CloudUserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar username vazio', () => {
      const invalidResponse = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: '',
        display_name: 'John Doe',
        account_id: '12345',
        account_status: 'active' as const,
        email: 'john.doe@example.com',
        created_on: '2023-01-01T00:00:00.000Z',
        has_2fa_enabled: false,
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/users/john.doe'
          },
          avatar: {
            href: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/JD-5.png'
          }
        }
      };

      expect(() => CloudUserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar account_status inválido', () => {
      const invalidResponse = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: 'john.doe',
        display_name: 'John Doe',
        account_id: '12345',
        account_status: 'pending' as any,
        email: 'john.doe@example.com',
        created_on: '2023-01-01T00:00:00.000Z',
        has_2fa_enabled: false,
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/users/john.doe'
          },
          avatar: {
            href: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/JD-5.png'
          }
        }
      };

      expect(() => CloudUserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar email inválido', () => {
      const invalidResponse = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: 'john.doe',
        display_name: 'John Doe',
        account_id: '12345',
        account_status: 'active' as const,
        email: 'invalid-email',
        created_on: '2023-01-01T00:00:00.000Z',
        has_2fa_enabled: false,
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/users/john.doe'
          },
          avatar: {
            href: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/JD-5.png'
          }
        }
      };

      expect(() => CloudUserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar created_on inválido', () => {
      const invalidResponse = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: 'john.doe',
        display_name: 'John Doe',
        account_id: '12345',
        account_status: 'active' as const,
        email: 'john.doe@example.com',
        created_on: 'invalid-date',
        has_2fa_enabled: false,
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/users/john.doe'
          },
          avatar: {
            href: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/JD-5.png'
          }
        }
      };

      expect(() => CloudUserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar links com href inválida', () => {
      const invalidResponse = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: 'john.doe',
        display_name: 'John Doe',
        account_id: '12345',
        account_status: 'active' as const,
        email: 'john.doe@example.com',
        created_on: '2023-01-01T00:00:00.000Z',
        has_2fa_enabled: false,
        links: {
          self: {
            href: 'invalid-url'
          },
          avatar: {
            href: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/JD-5.png'
          }
        }
      };

      expect(() => CloudUserResponseSchema.parse(invalidResponse)).toThrow();
    });
  });
});
