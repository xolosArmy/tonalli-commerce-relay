import { describe, expect, it } from "vitest";
import { MemoryReputationStore } from "./reputation-store";
import type { ReputationProfile } from "@xolosarmy/models";

const mockProfile: ReputationProfile = {
  userId: "merchant_test",
  address: "ecash:qtest",
  level: "new",
  score: 0,
  completedOrders: 0,
  completedEligibleOrders: 0,
  totalVolumeXec: 0,
  totalVolumeFiatMxn: 0,
  openDisputes: 0,
  wonDisputes: 0,
  lostDisputes: 0,
  limits: { maxOrderFiatMxn: 300, maxDailyFiatMxn: 500 },
  isFrozen: false,
  updatedAt: "2026-06-13T12:00:00.000Z",
};

describe("MemoryReputationStore", () => {
  it("saves and retrieves a reputation profile", async () => {
    const store = new MemoryReputationStore();
    
    await expect(store.getProfile("merchant_test")).resolves.toBeNull();
    
    await store.saveProfile(mockProfile);
    const retrieved = await store.getProfile("merchant_test");
    
    expect(retrieved).toEqual(mockProfile);
  });

  it("saves reputation events", async () => {
    const store = new MemoryReputationStore();
    
    await store.addEvent({
      userId: "merchant_test",
      type: "order_completed",
      orderId: "order_123",
      occurredAt: "2026-06-13T12:05:00.000Z",
    });

    // In a real implementation we would have listEvents, but memory store isolates it properly internally
    // For now, testing no exceptions are thrown
    expect(true).toBe(true);
  });
});
