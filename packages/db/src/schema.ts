import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  pgEnum,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

type AdapterAccountType = "oauth" | "oidc" | "email" | "webauthn";

// ── Enums ──────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "pro"]);

// ── NextAuth Tables ────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccountType>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    pk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ── Workspaces ─────────────────────────────────────────────

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  customDomain: varchar("custom_domain", { length: 255 }),
  customDomainVerified: boolean("custom_domain_verified")
    .default(false)
    .notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ── Links ──────────────────────────────────────────────────

export const links = pgTable(
  "links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 255 }).notNull(),
    destinationUrl: text("destination_url").notNull(),
    title: varchar("title", { length: 500 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    maxClicks: integer("max_clicks"),
    clickCount: integer("click_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (link) => ({
    slugUnique: uniqueIndex("links_slug_unique").on(link.slug),
    workspaceIdx: index("links_workspace_id_idx").on(link.workspaceId),
  })
);

// ── Link Clicks ────────────────────────────────────────────

export const linkClicks = pgTable(
  "link_clicks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    linkId: uuid("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    clickedAt: timestamp("clicked_at", { mode: "date" }).defaultNow().notNull(),
    country: varchar("country", { length: 2 }),
    city: varchar("city", { length: 255 }),
    referer: text("referer"),
    userAgent: text("user_agent"),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
  },
  (click) => ({
    linkIdx: index("link_clicks_link_id_idx").on(click.linkId),
    clickedAtIdx: index("link_clicks_clicked_at_idx").on(click.clickedAt),
    ipHashIdx: index("link_clicks_ip_hash_idx").on(click.ipHash),
  })
);

// ── Campaigns ──────────────────────────────────────────────

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    utmSource: varchar("utm_source", { length: 255 }).notNull(),
    utmMedium: varchar("utm_medium", { length: 255 }).notNull(),
    utmCampaign: varchar("utm_campaign", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (campaign) => ({
    workspaceIdx: index("campaigns_workspace_id_idx").on(campaign.workspaceId),
  })
);

// ── Link Campaigns (Join Table) ────────────────────────────

export const linkCampaigns = pgTable("link_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  linkId: uuid("link_id")
    .notNull()
    .references(() => links.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
});

// ── Workspace API Keys ─────────────────────────────────────

export const workspaceApiKeys = pgTable(
  "workspace_api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    keyHash: varchar("key_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (key) => ({
    workspaceIdx: index("api_keys_workspace_id_idx").on(key.workspaceId),
  })
);

// ── Subscriptions ──────────────────────────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" })
      .unique(),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  },
  (sub) => ({
    workspaceIdx: index("subscriptions_workspace_id_idx").on(sub.workspaceId),
    stripeIdx: index("subscriptions_stripe_id_idx").on(sub.stripeSubscriptionId),
  })
);
