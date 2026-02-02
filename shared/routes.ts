import { z } from 'zod';
import { 
  insertProfileSchema, 
  insertLibraryItemSchema, 
  insertStudyVaultItemSchema, 
  insertCommunityPostSchema, 
  insertCommunityReplySchema, 
  insertReportSchema,
  insertAnnouncementSchema,
  insertLibraryRatingSchema,
  insertLibraryCommentSchema,
  profiles,
  libraryItems,
  studyVaultItems,
  communityPosts,
  communityReplies,
  reports,
  announcements,
  warnings,
  libraryRatings,
  libraryComments
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
        200: z.array(z.any()),
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
    unlock: {
      method: 'POST' as const,
      path: '/api/library/:id/unlock',
      input: z.object({ password: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    rate: {
      method: 'POST' as const,
      path: '/api/library/:id/rate',
      input: z.object({ rating: z.number().min(1).max(5) }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    comments: {
      method: 'GET' as const,
      path: '/api/library/:id/comments',
      responses: {
        200: z.array(z.any()),
      },
    },
    addComment: {
      method: 'POST' as const,
      path: '/api/library/:id/comments',
      input: z.object({ content: z.string() }),
      responses: {
        201: z.custom<typeof libraryComments.$inferSelect>(),
      },
    },
    deleteComment: {
      method: 'DELETE' as const,
      path: '/api/library/:id/comments/:commentId',
      responses: {
        204: z.void(),
        403: errorSchemas.forbidden,
      },
    },
    pinComment: {
      method: 'POST' as const,
      path: '/api/library/:id/comments/:commentId/pin',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    unpinComment: {
      method: 'POST' as const,
      path: '/api/library/:id/comments/:commentId/unpin',
      responses: {
        200: z.object({ success: z.boolean() }),
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
    deletePost: {
      method: 'DELETE' as const,
      path: '/api/community/:id',
      responses: {
        204: z.void(),
        403: errorSchemas.forbidden,
      },
    },
  },
  admin: {
    users: {
      method: 'GET' as const,
      path: '/api/admin/users',
      responses: {
        200: z.array(z.any()),
        403: errorSchemas.forbidden,
      },
    },
    banUser: {
      method: 'POST' as const,
      path: '/api/admin/users/:userId/ban',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    unbanUser: {
      method: 'POST' as const,
      path: '/api/admin/users/:userId/unban',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    reports: {
      method: 'GET' as const,
      path: '/api/admin/reports',
      responses: {
        200: z.array(z.custom<typeof reports.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
    resolveReport: {
      method: 'POST' as const,
      path: '/api/admin/reports/:id/resolve',
      input: z.object({ status: z.enum(['resolved', 'dismissed']) }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    updateLibraryItem: {
      method: 'PUT' as const,
      path: '/api/library/:id',
      input: insertLibraryItemSchema.partial(),
      responses: {
        200: z.custom<typeof libraryItems.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
    muteUser: {
      method: 'POST' as const,
      path: '/api/admin/users/:userId/mute',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    unmuteUser: {
      method: 'POST' as const,
      path: '/api/admin/users/:userId/unmute',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    warnUser: {
      method: 'POST' as const,
      path: '/api/admin/users/:userId/warn',
      input: z.object({ reason: z.string() }),
      responses: {
        200: z.object({ success: z.boolean(), autoBanned: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    pinPost: {
      method: 'POST' as const,
      path: '/api/admin/posts/:postId/pin',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    unpinPost: {
      method: 'POST' as const,
      path: '/api/admin/posts/:postId/unpin',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
  },
  announcements: {
    list: {
      method: 'GET' as const,
      path: '/api/announcements',
      responses: {
        200: z.array(z.custom<typeof announcements.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/announcements',
      input: insertAnnouncementSchema.omit({ createdBy: true }),
      responses: {
        201: z.custom<typeof announcements.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/announcements/:id',
      responses: {
        204: z.void(),
        403: errorSchemas.forbidden,
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
