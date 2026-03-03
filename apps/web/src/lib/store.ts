import { hashApiKey } from './api-key';

export interface Link {
  id: string;
  slug: string;
  destination: string;
  passwordHash: string | null;
  workspaceId: string;
  expiresAt: Date | null;
  maxClicks: number | null;
  clickCount: number;
  campaignId: string | null;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  workspaceId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

export interface Workspace {
  id: string;
  plan: 'free' | 'pro';
  stripeCustomerId: string | null;
}

export interface ApiKeyRow {
  hash: string;
  workspaceId: string;
  createdBy: string;
}

// In-memory stores
const links = new Map<string, Link>();
const campaigns = new Map<string, Campaign>();
const workspaces = new Map<string, Workspace>();
const apiKeys = new Map<string, ApiKeyRow>();

export const db = {
  links: {
    findBySlug(slug: string): Link | undefined {
      for (const link of links.values()) {
        if (link.slug === slug) return link;
      }
      return undefined;
    },
    findById(id: string): Link | undefined {
      return links.get(id);
    },
    findByIdAndWorkspace(id: string, workspaceId: string): Link | undefined {
      const link = links.get(id);
      if (link && link.workspaceId === workspaceId) return link;
      return undefined;
    },
    create(link: Link): Link {
      links.set(link.id, link);
      return link;
    },
    incrementClicks(id: string): void {
      const link = links.get(id);
      if (link) link.clickCount++;
    },
  },
  campaigns: {
    findById(id: string): Campaign | undefined {
      return campaigns.get(id);
    },
    create(campaign: Campaign): Campaign {
      campaigns.set(campaign.id, campaign);
      return campaign;
    },
  },
  workspaces: {
    findById(id: string): Workspace | undefined {
      return workspaces.get(id);
    },
    findByStripeCustomerId(customerId: string): Workspace | undefined {
      for (const ws of workspaces.values()) {
        if (ws.stripeCustomerId === customerId) return ws;
      }
      return undefined;
    },
    create(workspace: Workspace): Workspace {
      workspaces.set(workspace.id, workspace);
      return workspace;
    },
    updatePlan(id: string, plan: 'free' | 'pro'): void {
      const ws = workspaces.get(id);
      if (ws) ws.plan = plan;
    },
  },
  apiKeys: {
    findByHash(hash: string): ApiKeyRow | undefined {
      return apiKeys.get(hash);
    },
    create(key: ApiKeyRow): ApiKeyRow {
      apiKeys.set(key.hash, key);
      return key;
    },
    createFromPlaintext(plaintext: string, workspaceId: string, createdBy: string): ApiKeyRow {
      const hash = hashApiKey(plaintext);
      const row: ApiKeyRow = { hash, workspaceId, createdBy };
      apiKeys.set(hash, row);
      return row;
    },
  },
  /** Clear all data — used in tests */
  _reset(): void {
    links.clear();
    campaigns.clear();
    workspaces.clear();
    apiKeys.clear();
  },
};
