import type { ReputationProfile } from "@xolosarmy/models";
import type { ReputationEvent } from "@xolosarmy/reputation";

export interface ReputationStore {
  getProfile(userId: string): Promise<ReputationProfile | null>;
  saveProfile(profile: ReputationProfile): Promise<void>;
  addEvent(event: ReputationEvent): Promise<void>;
}

export class MemoryReputationStore implements ReputationStore {
  private readonly profiles = new Map<string, ReputationProfile>();
  private readonly events = new Map<string, ReputationEvent[]>();

  async getProfile(userId: string): Promise<ReputationProfile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async saveProfile(profile: ReputationProfile): Promise<void> {
    this.profiles.set(profile.userId, profile);
  }

  async addEvent(event: ReputationEvent): Promise<void> {
    const userEvents = this.events.get(event.userId) ?? [];
    userEvents.push(event);
    this.events.set(event.userId, userEvents);
  }
}

const globalForReputationStore = globalThis as typeof globalThis & {
  __tonalliReputationStore?: MemoryReputationStore;
};

export const reputationStore =
  globalForReputationStore.__tonalliReputationStore ??= new MemoryReputationStore();
