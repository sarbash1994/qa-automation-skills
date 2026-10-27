/** Sends a "your order is ready" notification if the order became ready within the last hour. */
export async function notifyUser(orderId: string): Promise<'sent' | 'skipped'> {
  const res = await fetch(`/api/orders/${orderId}`);
  if (!res.ok) throw new Error(`Order lookup failed: ${res.status}`);
  const order = (await res.json()) as { userId: string; readyAt: string | null };
  if (!order.readyAt) return 'skipped';
  const ageMs = Date.now() - new Date(order.readyAt).getTime();
  if (ageMs > 60 * 60 * 1000) return 'skipped';
  const sent = await fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ userId: order.userId, orderId }) });
  if (!sent.ok) throw new Error(`Notification failed: ${sent.status}`);
  return 'sent';
}
