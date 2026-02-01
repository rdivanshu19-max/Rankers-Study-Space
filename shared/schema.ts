import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import auth and chat models to re-export or extend
import { users as authUsers } from "./models/auth";
import { conversations, messages } from "./models/chat";

export * from "./models/auth";
export * from "./models/chat";

// Extend users table if needed, but for now we'll use the one from auth
// We might want to add a role column to users via a separate profile table or just assume 
// we can join on the auth user id. 
// Since we can't easily modify the auth table structure defined in the integration without migration issues sometimes,
// let's create a 'profiles' table that links to users, OR just use the 'users' table if we can map it.
// The auth integration defines: id, email, firstName, lastName, profileImageUrl.
// We need 'role', 'username' (nickname), 'bio'.
// Let's create a profiles table 1:1 with users.

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // Links to auth.users.id
  username: text("username"), // Nickname
  bio: text("bio"),
  profilePhotoUrl: text("profile_photo_url"), // Custom profile photo
  role: text("role").default("student").notNull(), // 'student' | 'admin'
  isBanned: boolean("is_banned").default(false).notNull(),
  isMuted: boolean("is_muted").default(false).notNull(),
  warningCount: integer("warning_count").default(0).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const libraryItems = pgTable("library_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'Book', 'Lecture PDF', 'Question Paper'
  fileUrl: text("file_url"), // Can be null if using link
  linkUrl: text("link_url"), // External document link
  uploadedBy: text("uploaded_by").notNull(), // userId
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyVaultItems = pgTable("study_vault_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  fileUrl: text("file_url"), // Can be null if using link
  linkUrl: text("link_url"), // External document link
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  type: text("type").default("text"), // 'text', 'photo', 'video', 'link'
  mediaUrl: text("media_url"),
  linkUrl: text("link_url"), // External link
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityReplies = pgTable("community_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postReactions = pgTable("post_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: text("user_id").notNull(),
  emoji: text("emoji").notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").notNull(), // postId or replyId
  targetType: text("target_type").notNull(), // 'post' or 'reply'
  targetUserId: text("target_user_id"), // userId of the reported user
  reason: text("reason").notNull(),
  reportedBy: text("reported_by").notNull(),
  status: text("status").default("pending"), // 'pending', 'resolved', 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const warnings = pgTable("warnings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  reason: text("reason").notNull(),
  issuedBy: text("issued_by").notNull(), // admin userId
  createdAt: timestamp("created_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(), // admin userId
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(authUsers, {
    fields: [profiles.userId],
    references: [authUsers.id],
  }),
}));

export const libraryItemsRelations = relations(libraryItems, ({ one }) => ({
  uploader: one(profiles, {
    fields: [libraryItems.uploadedBy],
    references: [profiles.userId],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [communityPosts.userId],
    references: [profiles.userId],
  }),
  replies: many(communityReplies),
  reactions: many(postReactions),
}));

export const communityRepliesRelations = relations(communityReplies, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityReplies.postId],
    references: [communityPosts.id],
  }),
  author: one(profiles, {
    fields: [communityReplies.userId],
    references: [profiles.userId],
  }),
}));

// Schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, joinedAt: true });
export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({ id: true, createdAt: true });
export const insertStudyVaultItemSchema = createInsertSchema(studyVaultItems).omit({ id: true, createdAt: true });
export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true, isPinned: true });
export const insertCommunityReplySchema = createInsertSchema(communityReplies).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, status: true });
export const insertWarningSchema = createInsertSchema(warnings).omit({ id: true, createdAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type InsertLibraryItem = z.infer<typeof insertLibraryItemSchema>;
export type StudyVaultItem = typeof studyVaultItems.$inferSelect;
export type InsertStudyVaultItem = z.infer<typeof insertStudyVaultItemSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityReply = typeof communityReplies.$inferSelect;
export type InsertCommunityReply = z.infer<typeof insertCommunityReplySchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Warning = typeof warnings.$inferSelect;
export type InsertWarning = z.infer<typeof insertWarningSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Extended types for frontend
export type CommunityPostWithAuthor = CommunityPost & {
  author: Profile | null;
  replies?: (CommunityReply & { author: Profile | null })[];
  reactions?: typeof postReactions.$inferSelect[];
};
