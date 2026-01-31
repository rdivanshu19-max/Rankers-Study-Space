import { z } from 'zod';
import { 
  insertProfileSchema, 
  insertLibraryItemSchema, 
  insertStudyVaultItemSchema, 
  insertCommunityPostSchema, 
  insertCommunityReplySchema, 
  insertReportSchema,
  profiles,
  libraryItems,
  studyVaultItems,
  communityPosts,
  communityReplies,
  reports
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/me',
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
      },
    },
    verifyAdmin: {
      method: 'POST' as const,
      path: '/api/admin/verify',
      input: z.object({ passcode: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
  },
  library: {
    list: {
      method: 'GET' as const,
      path: '/api/library',
      input: z.object({
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof libraryItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/library',
      input: insertLibraryItemSchema.omit({ uploadedBy: true }),
      responses: {
        201: z.custom<typeof libraryItems.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/library/:id',
      responses: {
        204: z.void(),
        403: errorSchemas.forbidden,
      },
    },
  },
  studyVault: {
    list: {
      method: 'GET' as const,
      path: '/api/vault',
      responses: {
        200: z.array(z.custom<typeof studyVaultItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vault',
      input: insertStudyVaultItemSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof studyVaultItems.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/vault/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  community: {
    list: {
      method: 'GET' as const,
      path: '/api/community',
      responses: {
        200: z.array(z.any()), // Complex joined type
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/community',
      input: insertCommunityPostSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof communityPosts.$inferSelect>(),
      },
    },
    reply: {
      method: 'POST' as const,
      path: '/api/community/:postId/replies',
      input: insertCommunityReplySchema.omit({ userId: true, postId: true }),
      responses: {
        201: z.custom<typeof communityReplies.$inferSelect>(),
      },
    },
    react: {
      method: 'POST' as const,
      path: '/api/community/:postId/react',
      input: z.object({ emoji: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    report: {
      method: 'POST' as const,
      path: '/api/community/report',
      input: insertReportSchema.omit({ reportedBy: true }),
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
