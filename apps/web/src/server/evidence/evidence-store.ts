import { randomUUID } from "node:crypto";

export type EvidenceType =
  | "receipt"
  | "tracking"
  | "delivery_confirmation"
  | "conversation"
  | "txid"
  | "other";

export interface EvidenceRecord {
  id: string;
  orderId: string;
  type: EvidenceType;
  uri?: string;
  hash?: string;
  notes?: string;
  externalReference?: string;
  submittedByUserId?: string;
  submittedAt: string;
  createdAt: string;
}

export type CreateEvidenceInput = Omit<EvidenceRecord, "id" | "createdAt">;

export interface EvidenceStore {
  create(recordInput: CreateEvidenceInput): Promise<EvidenceRecord>;
  listByOrderId(orderId: string): Promise<EvidenceRecord[]>;
}

export class MemoryEvidenceStore implements EvidenceStore {
  private readonly evidenceByOrderId = new Map<string, EvidenceRecord[]>();

  async create(recordInput: CreateEvidenceInput): Promise<EvidenceRecord> {
    const record: EvidenceRecord = {
      ...recordInput,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const orderEvidence = this.evidenceByOrderId.get(record.orderId) ?? [];

    this.evidenceByOrderId.set(record.orderId, [...orderEvidence, record]);

    return record;
  }

  async listByOrderId(orderId: string): Promise<EvidenceRecord[]> {
    return [...(this.evidenceByOrderId.get(orderId) ?? [])].sort((left, right) =>
      left.submittedAt.localeCompare(right.submittedAt),
    );
  }
}

const globalForEvidenceStore = globalThis as typeof globalThis & {
  __tonalliEvidenceStore?: MemoryEvidenceStore;
};

export const evidenceStore =
  globalForEvidenceStore.__tonalliEvidenceStore ??= new MemoryEvidenceStore();
