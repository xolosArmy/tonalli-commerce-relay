import { describe, expect, it } from "vitest";

import { MemoryEvidenceStore } from "./evidence-store";

describe("MemoryEvidenceStore", () => {
  it("creates evidence records with generated ids and timestamps", async () => {
    const store = new MemoryEvidenceStore();
    const evidence = await store.create({
      orderId: "order-1",
      type: "receipt",
      uri: "https://example.com/receipt.png",
      hash: "sha256-placeholder",
      notes: "Paid",
      externalReference: "AMZ-123",
      submittedByUserId: "merchant-1",
      submittedAt: "2026-06-12T20:00:00.000Z",
    });

    expect(typeof evidence.id).toBe("string");
    expect(Date.parse(evidence.createdAt)).not.toBeNaN();
    expect(evidence).toMatchObject({
      orderId: "order-1",
      type: "receipt",
      uri: "https://example.com/receipt.png",
      hash: "sha256-placeholder",
      notes: "Paid",
      externalReference: "AMZ-123",
      submittedByUserId: "merchant-1",
      submittedAt: "2026-06-12T20:00:00.000Z",
    });
  });

  it("lists evidence for an order by submittedAt ascending", async () => {
    const store = new MemoryEvidenceStore();

    await store.create({
      orderId: "order-1",
      type: "tracking",
      submittedAt: "2026-06-12T21:00:00.000Z",
    });
    await store.create({
      orderId: "order-2",
      type: "txid",
      submittedAt: "2026-06-12T19:30:00.000Z",
    });
    await store.create({
      orderId: "order-1",
      type: "receipt",
      submittedAt: "2026-06-12T20:00:00.000Z",
    });

    const evidence = await store.listByOrderId("order-1");

    expect(evidence.map((record) => record.type)).toEqual([
      "receipt",
      "tracking",
    ]);
  });

  it("returns an empty list for orders without evidence", async () => {
    const store = new MemoryEvidenceStore();

    await expect(store.listByOrderId("missing-order")).resolves.toEqual([]);
  });
});
