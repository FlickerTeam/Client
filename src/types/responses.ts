export interface DomainsResponse {
  cdn: string;
  assets?: string;
  gateway: string;
  defaultApiVersion: string;
  apiEndpoint: string;
}

export interface ErrorResponse {
  code?: number;
  message?: string;
}

export interface SpacebarResponse {
  api: string;
}
