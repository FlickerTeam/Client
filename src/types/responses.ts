interface DomainsResponse {
  cdn: string;
  assets?: string;
  gateway: string;
  defaultApiVersion: string;
  apiEndpoint: string;
}

interface ErrorResponse {
  code?: number;
  message?: string;
}

interface SpacebarResponse {
  api: string;
}
