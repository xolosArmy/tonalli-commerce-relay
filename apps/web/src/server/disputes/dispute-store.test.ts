import { describe, expect, it } from "vitest";

import { MemoryDisputeStore } from "./dispute-store";

describe("MemoryDisputeStore", () => {
  it("creates and finds disputes by order id", async () => {
    const store = new MemoryDisputeStore();
    const dispute = await store.createDispute({
      orderId: "order-1",
      status: "open",
      openedByUserId: "buyer-1",
      reason: "Item was not delivered",
      openedAt: "2026-06-12T20:00:00.000Z",
    });

    expect(typeof dispute.id).toBe("string");
    expect(Date.parse(dispute.createdAt)).not.toBeNaN();
    expect(Date.parse(dispute.updatedAt)).not.toBeNaN();
    await expect(store.findByOrderId("order-1")).resolves.toEqual(dispute);
  });

  it("updates disputes and preserves immutable fields", async () => {
    const store = new MemoryDisputeStore();
    const dispute = await store.createDispute({
      orderId: "order-1",
      status: "open",
      openedByUserId: "buyer-1",
      reason: "Item was not delivered",
      openedAt: "2026-06-12T20:00:00.000Z",
    });

    const updated = await store.updateDispute(dispute.id, {
      status: "resolved",
      resolution: "refund",
      resolvedByUserId: "arbitrator-1",
      resolvedAt: "2026-06-12T22:00:00.000Z",
    });

    expect(updated).toMatchObject({
      id: dispute.id,
      orderId: "order-1",
      status: "resolved",
      openedByUserId: "buyer-1",
      reason: "Item was not delivered",
      openedAt: "2026-06-12T20:00:00.000Z",
      resolution: "refund",
      resolvedByUserId: "arbitrator-1",
      resolvedAt: "2026-06-12T22:00:00.000Z",
      createdAt: dispute.createdAt,
    });
    expect(Date.parse(updated?.updatedAt ?? "")).not.toBeNaN();
  });

  it("returns null when updating a missing dispute", async () => {
    const store = new MemoryDisputeStore();

    await expect(
      store.updateDispute("missing-dispute", { status: "resolved" }),
    ).resolves.toBeNull();
  });

  it("adds and lists events by createdAt ascending", async () => {
    const store = new MemoryDisputeStore();
    const dispute = await store.createDispute({
      orderId: "order-1",
      status: "open",
      openedByUserId: "buyer-1",
      reason: "Item was not delivered",
      openedAt: "2026-06-12T20:00:00.000Z",
    });

    const firstEvent = await store.addEvent({
      disputeId: dispute.id,
      type: "message_added",
      actorUserId: "buyer-1",
      payload: { message: "Tracking never arrived" },
    });
    const secondEvent = await store.addEvent({
      disputeId: dispute.id,
      type: "evidence_added",
      actorUserId: "merchant-1",
      payload: { evidenceId: "evidence-1" },
    });

    await expect(store.listEvents(dispute.id)).resolves.toEqual([
      firstEvent,
      secondEvent,
    ]);
    await expect(store.listEvents("missing-dispute")).resolves.toEqual([]);
  });
});
