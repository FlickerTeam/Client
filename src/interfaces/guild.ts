export interface Guild {
    id: string;
    name: string;
    icon: string | null;
    owner_id: string;
    channels: any[];
}