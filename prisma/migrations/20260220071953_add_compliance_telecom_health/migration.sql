-- CreateTable
CREATE TABLE "SmsConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'opted-in',
    "source" TEXT NOT NULL DEFAULT 'sms',
    "optInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optOutAt" DATETIME,
    "optOutMethod" TEXT,
    "consentText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SmsConsent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "phone" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TelecomHealth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "messagesDelivered" INTEGER NOT NULL DEFAULT 0,
    "messagesFailed" INTEGER NOT NULL DEFAULT 0,
    "messagesBlocked" INTEGER NOT NULL DEFAULT 0,
    "optOuts" INTEGER NOT NULL DEFAULT 0,
    "optIns" INTEGER NOT NULL DEFAULT 0,
    "deliveryRate" REAL NOT NULL DEFAULT 100,
    "optOutRate" REAL NOT NULL DEFAULT 0,
    "errorCodes" TEXT,
    "spamRiskScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelecomHealth_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "serviceArea" TEXT,
    "industry" TEXT NOT NULL DEFAULT 'Handyman & Home Improvement',
    "logo" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "aiGreeting" TEXT,
    "aiTone" TEXT DEFAULT 'friendly, professional, confident',
    "aiServices" TEXT,
    "aiEscalationMsg" TEXT DEFAULT 'I''ll forward this to our project manager so we can assist you properly.',
    "aiPricingMsg" TEXT DEFAULT 'Pricing depends on scope and photos. Once we review details, we can provide an estimate.',
    "voiceId" TEXT,
    "voiceProvider" TEXT DEFAULT 'default',
    "whiteLabelConfig" TEXT,
    "twilioSubAccountSid" TEXT,
    "twilioSubAuthToken" TEXT,
    "missedCallTextBack" BOOLEAN NOT NULL DEFAULT true,
    "missedCallMessage" TEXT,
    "businessHours" TEXT,
    "emergencyNumber" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "leadRoutingMode" TEXT NOT NULL DEFAULT 'auto',
    "afterHoursMessage" TEXT,
    "maxSmsPerDay" INTEGER NOT NULL DEFAULT 100,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Company" ("address", "aiEscalationMsg", "aiGreeting", "aiPricingMsg", "aiServices", "aiTone", "createdAt", "email", "id", "industry", "logo", "missedCallMessage", "missedCallTextBack", "name", "onboardingDone", "onboardingStep", "phone", "serviceArea", "twilioSubAccountSid", "twilioSubAuthToken", "updatedAt", "voiceId", "voiceProvider", "website", "whiteLabelConfig") SELECT "address", "aiEscalationMsg", "aiGreeting", "aiPricingMsg", "aiServices", "aiTone", "createdAt", "email", "id", "industry", "logo", "missedCallMessage", "missedCallTextBack", "name", "onboardingDone", "onboardingStep", "phone", "serviceArea", "twilioSubAccountSid", "twilioSubAuthToken", "updatedAt", "voiceId", "voiceProvider", "website", "whiteLabelConfig" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SmsConsent_companyId_idx" ON "SmsConsent"("companyId");

-- CreateIndex
CREATE INDEX "SmsConsent_phone_idx" ON "SmsConsent"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "SmsConsent_companyId_phone_key" ON "SmsConsent"("companyId", "phone");

-- CreateIndex
CREATE INDEX "ComplianceLog_companyId_idx" ON "ComplianceLog"("companyId");

-- CreateIndex
CREATE INDEX "ComplianceLog_event_idx" ON "ComplianceLog"("event");

-- CreateIndex
CREATE INDEX "TelecomHealth_companyId_idx" ON "TelecomHealth"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TelecomHealth_companyId_period_periodStart_key" ON "TelecomHealth"("companyId", "period", "periodStart");
