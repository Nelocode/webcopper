-- Add unique constraint on Contact.email
-- Duplicates were cleaned up beforehand, so this should succeed.
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_email_key" ON "Contact"("email");
