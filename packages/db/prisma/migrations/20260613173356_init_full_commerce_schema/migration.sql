-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "alias" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "alias" TEXT,
    "purpose" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "intermediaryUserId" TEXT,
    "arbitratorUserId" TEXT,
    "moderatorUserId" TEXT,
    "status" TEXT NOT NULL,
    "disputeStatus" TEXT NOT NULL,
    "product" JSONB NOT NULL,
    "quote" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowRecord" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "escrowAddress" TEXT,
    "escrowScriptHex" TEXT,
    "depositTxid" TEXT,
    "releaseTxid" TEXT,
    "refundTxid" TEXT,
    "nonce" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvidence" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uri" TEXT,
    "hash" TEXT,
    "notes" TEXT,
    "externalReference" TEXT,
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "openedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "resolvedByUserId" TEXT,
    "resolution" TEXT,
    "authority" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeEvent" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "User_alias_key" ON "User"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "AuthChallenge_nonce_key" ON "AuthChallenge"("nonce");

-- CreateIndex
CREATE INDEX "AuthChallenge_address_idx" ON "AuthChallenge"("address");

-- CreateIndex
CREATE INDEX "AuthChallenge_expiresAt_idx" ON "AuthChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthChallenge_usedAt_idx" ON "AuthChallenge"("usedAt");

-- CreateIndex
CREATE INDEX "AuthChallenge_revokedAt_idx" ON "AuthChallenge"("revokedAt");

-- CreateIndex
CREATE INDEX "AuthChallenge_domain_address_idx" ON "AuthChallenge"("domain", "address");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_buyerUserId_idx" ON "Order"("buyerUserId");

-- CreateIndex
CREATE INDEX "Order_intermediaryUserId_idx" ON "Order"("intermediaryUserId");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowRecord_orderId_key" ON "EscrowRecord"("orderId");

-- CreateIndex
CREATE INDEX "EscrowRecord_depositTxid_idx" ON "EscrowRecord"("depositTxid");

-- CreateIndex
CREATE INDEX "EscrowRecord_releaseTxid_idx" ON "EscrowRecord"("releaseTxid");

-- CreateIndex
CREATE INDEX "EscrowRecord_refundTxid_idx" ON "EscrowRecord"("refundTxid");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");

-- CreateIndex
CREATE INDEX "OrderEvent_type_idx" ON "OrderEvent"("type");

-- CreateIndex
CREATE INDEX "OrderEvent_createdAt_idx" ON "OrderEvent"("createdAt");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderEvidence_orderId_idx" ON "OrderEvidence"("orderId");

-- CreateIndex
CREATE INDEX "OrderEvidence_type_idx" ON "OrderEvidence"("type");

-- CreateIndex
CREATE INDEX "OrderEvidence_submittedByUserId_idx" ON "OrderEvidence"("submittedByUserId");

-- CreateIndex
CREATE INDEX "OrderEvidence_submittedAt_idx" ON "OrderEvidence"("submittedAt");

-- CreateIndex
CREATE INDEX "OrderEvidence_orderId_submittedAt_idx" ON "OrderEvidence"("orderId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_orderId_key" ON "Dispute"("orderId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_openedByUserId_idx" ON "Dispute"("openedByUserId");

-- CreateIndex
CREATE INDEX "Dispute_resolvedByUserId_idx" ON "Dispute"("resolvedByUserId");

-- CreateIndex
CREATE INDEX "Dispute_openedAt_idx" ON "Dispute"("openedAt");

-- CreateIndex
CREATE INDEX "Dispute_resolvedAt_idx" ON "Dispute"("resolvedAt");

-- CreateIndex
CREATE INDEX "DisputeEvent_disputeId_idx" ON "DisputeEvent"("disputeId");

-- CreateIndex
CREATE INDEX "DisputeEvent_type_idx" ON "DisputeEvent"("type");

-- CreateIndex
CREATE INDEX "DisputeEvent_actorUserId_idx" ON "DisputeEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "DisputeEvent_createdAt_idx" ON "DisputeEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DisputeEvent_disputeId_createdAt_idx" ON "DisputeEvent"("disputeId", "createdAt");

-- AddForeignKey
ALTER TABLE "EscrowRecord" ADD CONSTRAINT "EscrowRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvidence" ADD CONSTRAINT "OrderEvidence_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEvent" ADD CONSTRAINT "DisputeEvent_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
