export class Snowflake {
  InternalID: bigint;
  static readonly DISCORD_EPOCH: bigint = 1420070400000n;

  constructor(ID: string) {
    this.InternalID = BigInt(ID);
  }

  deconstruct(): Date {
    const timestamp = (this.InternalID >> 22n) + Snowflake.DISCORD_EPOCH;
    return new Date(Number(timestamp));
  }

  format(): string {
    const msgDate = this.deconstruct();
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMsg = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

    const diffInMs = startOfToday.getTime() - startOfMsg.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    const timeStr = msgDate
      .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      .toLowerCase();

    if (diffInDays === 0) return `Today at ${timeStr}`;
    if (diffInDays === 1) return `Yesterday at ${timeStr}`;
    if (diffInDays < 7) return `${String(diffInDays)} days ago`;

    return msgDate.toLocaleDateString();
  }
}
