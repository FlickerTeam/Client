export const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (msgDate.getTime() === today.getTime()) return `Today at ${timeStr}`;
  if (msgDate.getTime() === yesterday.getTime()) return `Yesterday at ${timeStr}`;
  return `${date.toLocaleDateString()} ${timeStr}`;
};
