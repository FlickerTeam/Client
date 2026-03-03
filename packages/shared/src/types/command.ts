export interface Command {
  name: string;
  description: string;
  onUse: (parameters: string[]) => string | null | undefined;
}
