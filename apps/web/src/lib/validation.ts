import { z } from "zod";

export const createLinkSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_-]+$/, "Slug must be alphanumeric, hyphens, or underscores")
    .optional(),
  destination: z.string().url("Must be a valid URL").max(2048),
  title: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
  maxClicks: z.number().int().positive().optional(),
  password: z.string().min(1).max(128).optional(),
  campaignId: z.string().uuid().optional(),
});

export const updateLinkSchema = z.object({
  title: z.string().max(500).optional(),
  destination: z.string().url().max(2048).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  maxClicks: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  utmSource: z.string().min(1).max(255),
  utmMedium: z.string().min(1).max(255),
  utmCampaign: z.string().min(1).max(255),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  filter: z.enum(["active", "expired", "all"]).default("all"),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(["7d", "30d", "all"]).default("7d"),
});

export const qrQuerySchema = z.object({
  format: z.enum(["png", "svg"]).default("png"),
  size: z.coerce.number().int().min(128).max(1024).default(256),
});

export const domainSchema = z.object({
  customDomain: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, "Invalid domain"),
});

export const passwordUnlockSchema = z.object({
  password: z.string().min(1).max(128),
});
