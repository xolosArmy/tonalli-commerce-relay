import { randomUUID } from "node:crypto";

export type DisputeEventPayload = Record<string, unknown>;

export interface DisputeRecord {
  id: string;
  orderId: string;
  status: string;
  openedByUserId: string;
  reason: string;
  openedAt: string;
  resolvedByUserId?: string;
  resolution?: string;
  authority?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeEventRecord {
  id: string;
  disputeId: string;
  type: string;
  actorUserId?: string;
  payload?: DisputeEventPayload;
  createdAt: string;
}

export type CreateDisputeInput = Omit<
  DisputeRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateDisputePatch = Partial<
  Pick<
    DisputeRecord,
    | "status"
    | "reason"
    | "resolvedByUserId"
    | "resolution"
    | "authority"
    | "resolvedAt"
  >
>;

export type AddDisputeEventInput = Omit<
  DisputeEventRecord,
  "id" | "createdAt"
>;

export interface DisputeStore {
  createDispute(input: CreateDisputeInput): Promise<DisputeRecord>;
  findByOrderId(orderId: string): Promise<DisputeRecord | null>;
  updateDispute(
    id: string,
    patch: UpdateDisputePatch,
  ): Promise<DisputeRecord | null>;
  addEvent(input: AddDisputeEventInput): Promise<DisputeEventRecord>;
  listEvents(disputeId: string): Promise<DisputeEventRecord[]>;
}

export class MemoryDisputeStore implements DisputeStore {
  private readonly disputesByOrderId = new Map<string, DisputeRecord>();
  private readonly eventsByDisputeId = new Map<string, DisputeEventRecord[]>();

  async createDispute(input: CreateDisputeInput): Promise<DisputeRecord> {
    const now = new Date().toISOString();
    const dispute: DisputeRecord = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    this.disputesByOrderId.set(dispute.orderId, dispute);

    return dispute;
  }

  async findByOrderId(orderId: string): Promise<DisputeRecord | null> {
    return this.disputesByOrderId.get(orderId) ?? null;
  }

  async updateDispute(
    id: string,
    patch: UpdateDisputePatch,
  ): Promise<DisputeRecord | null> {
    const existing = this.findDisputeById(id);

    if (existing === null) {
      return null;
    }

    const updated: DisputeRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      orderId: existing.orderId,
      openedByUserId: existing.openedByUserId,
      openedAt: existing.openedAt,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.disputesByOrderId.set(updated.orderId, updated);

    return updated;
  }

  async addEvent(input: AddDisputeEventInput): Promise<DisputeEventRecord> {
    const event: DisputeEventRecord = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const disputeEvents = this.eventsByDisputeId.get(event.disputeId) ?? [];

    this.eventsByDisputeId.set(event.disputeId, [...disputeEvents, event]);

    return event;
  }

  async listEvents(disputeId: string): Promise<DisputeEventRecord[]> {
    return [...(this.eventsByDisputeId.get(disputeId) ?? [])].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }

  private findDisputeById(id: string): DisputeRecord | null {
    for (const dispute of this.disputesByOrderId.values()) {
      if (dispute.id === id) {
        return dispute;
      }
    }

    return null;
  }
}

const globalForDisputeStore = globalThis as typeof globalThis & {
  __tonalliDisputeStore?: MemoryDisputeStore;
};

export const disputeStore =
  globalForDisputeStore.__tonalliDisputeStore ??= new MemoryDisputeStore();
