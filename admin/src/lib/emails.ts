async function sendEmail(
  type: "approval" | "rejection" | "suspension",
  to: string,
  firstName: string
): Promise<void> {
  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, to, firstName }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error ?? "Failed to send email");
  }
}

export const sendApprovalEmail = (to: string, firstName: string) =>
  sendEmail("approval", to, firstName);

export const sendRejectionEmail = (to: string, firstName: string) =>
  sendEmail("rejection", to, firstName);

export const sendSuspensionEmail = (to: string, firstName: string) =>
  sendEmail("suspension", to, firstName);
