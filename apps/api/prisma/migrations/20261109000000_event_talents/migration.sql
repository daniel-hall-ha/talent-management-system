-- CreateTable
CREATE TABLE "_EventTalents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventTalents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventTalents_B_index" ON "_EventTalents"("B");

-- AddForeignKey
ALTER TABLE "_EventTalents" ADD CONSTRAINT "_EventTalents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTalents" ADD CONSTRAINT "_EventTalents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

