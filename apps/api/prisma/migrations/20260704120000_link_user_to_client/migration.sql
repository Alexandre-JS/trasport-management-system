-- AlterTable: optional link from a user to the client they represent (portal access)
ALTER TABLE "users" ADD COLUMN "clientId" UUID;

-- CreateIndex
CREATE INDEX "users_clientId_idx" ON "users"("clientId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
