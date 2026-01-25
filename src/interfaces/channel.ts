export interface Channel {
  id: string;
  guild_id?: string;
  type: number;
  name: string;
  topic?: string | null;
}
