import { prisma, type Prisma } from "@xolosarmy/db";

import type {
  CreateEvidenceInput,
  EvidenceRecord,
  EvidenceStore,
  EvidenceType,
} from "./evidence-store";

type PrismaOrderEvidence = Prisma.OrderEvidenceGetPayload<Record<string, never>>;

export class PrismaEvidenceStore implements EvidenceStore {
  async create(recordInput: CreateEvidenceInput): Promise<EvidenceRecord> {
    const createdEvidence = await prisma.orderEvidence.create({
      data: {
        orderId: recordInput.orderId,
        type: recordInput.type,
        uri: recordInput.uri,
        hash: recordInput.hash,
        notes: recordInput.notes,
        externalReference: recordInput.externalReference,
        submittedByUserId: recordInput.submittedByUserId,
        submittedAt: new Date(recordInput.submittedAt),
      },
    });

    return toEvidenceRecord(createdEvidence);
  }

  async listByOrderId(orderId: string): Promise<EvidenceRecord[]> {
    const evidence = await prisma.orderEvidence.findMany({
      where: { orderId },
      orderBy: { submittedAt: "asc" },
    });

    return evidence.map(toEvidenceRecord);
  }
}

function toEvidenceRecord(evidence: PrismaOrderEvidence): EvidenceRecord {
  return {
    id: evidence.id,
    orderId: evidence.orderId,
    type: toEvidenceType(evidence.type),
    uri: evidence.uri ?? undefined,
    hash: evidence.hash ?? undefined,
    notes: evidence.notes ?? undefined,
    externalReference: evidence.externalReference ?? undefined,
    submittedByUserId: evidence.submittedByUserId ?? undefined,
    submittedAt: evidence.submittedAt.toISOString(),
    createdAt: evidence.createdAt.toISOString(),
  };
}

function toEvidenceType(type: string): EvidenceType {
  if (
    type === "receipt" ||
    type === "tracking" ||
    type === "delivery_confirmation" ||
    type === "conversation" ||
    type === "txid" ||
    type === "other"
  ) {
    return type;
  }

  throw new Error(`Unsupported evidence type: ${type}`);
}
