import { logger } from './logger';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  onProgress?: (loaded: number, total: number) => void;
  baseUrl?: string;
}

interface RateLimitResponse {
  message?: string;
  retry_after?: number;
  code?: number;
}

export class ApiError extends Error {
  responseBody?: RateLimitResponse;
  constructor(message: string, responseBody?: RateLimitResponse) {
    super(message);
    this.responseBody = responseBody;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const request = <T = unknown>(
  endpoint: string,
  method: RequestMethod = 'GET',
  options: RequestOptions = {},
): Promise<T> => {
  //oh yeah its fucking .NET again
  const baseUrl = options.baseUrl || (localStorage.getItem('selectedInstanceUrl') ?? '');
  const version = localStorage.getItem('defaultApiVersion') ?? '';
  const token = localStorage.getItem('selectedAuthorization') ?? '';
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanVersion = version.replace(/^\/+|\/+$/g, '');
  const cleanPath = endpoint.replace(/^\/+/, '');
  const fullUrlString = `${cleanBase}/${cleanVersion}/${cleanPath}`;
  const url = new URL(fullUrlString);

  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      url.searchParams.append(key, val);
    });
  }

  if (options.onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url.toString());

      xhr.setRequestHeader('Authorization', token);

      if (!(options.body instanceof FormData)) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }

      if (options.headers) {
        Object.entries(options.headers).forEach(([key, val]) => {
          if (key.toLowerCase() === 'content-type' && options.body instanceof FormData) return;
          xhr.setRequestHeader(key, val);
        });
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && options.onProgress) {
          options.onProgress(e.loaded, e.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 429) {
          const data = JSON.parse(xhr.responseText) as RateLimitResponse;
          const retryAfter = data.retry_after ?? 1000;
          logger.error(`API`, `Rate limited. Retrying after ${retryAfter.toString()}ms`);
          void sleep(retryAfter).then(() => {
            resolve(request<T>(endpoint, method, options));
          });
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (xhr.status === 204) {
            resolve(null as T);
          } else {
            const parsed = JSON.parse(xhr.responseText) as unknown;
            resolve(parsed as T);
          }
        } else {
          const errorData = JSON.parse(xhr.responseText || '{}') as RateLimitResponse; //uhh??
          const error = new ApiError(
            errorData.message || `Request failed with status ${xhr.status.toString()}`,
            errorData,
          );
          reject(error);
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network Error'));
      };

      const payload =
        options.body instanceof FormData ? options.body : JSON.stringify(options.body);

      xhr.send(payload as XMLHttpRequestBodyInit);
    });
  }

  const requestHeaders: Record<string, string> = {
    Authorization: token,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.body instanceof FormData) {
    delete requestHeaders['Content-Type'];
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (options.body && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    fetchOptions.body = options.body;
  }

  const sendRequest = async (): Promise<T> => {
    const response = await fetch(url.toString(), fetchOptions);

    if (response.status === 429) {
      const data = (await response.json()) as RateLimitResponse;
      const retryAfter = data.retry_after ?? 1000;

      logger.error(`API`, `Rate limited. Retrying after ${retryAfter.toString()}ms`); //Should we visually show the user this?

      await sleep(retryAfter);

      return sendRequest();
    }

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as RateLimitResponse;
      throw new ApiError(
        errorData.message ?? `Request failed with status ${String(response.status)}`,
        errorData,
      );
    }

    if (response.status === 204) {
      return null as T;
    }

    if (response.status === 204) return null as T;
    const result = (await response.json()) as unknown;
    return result as T;
  };

  return sendRequest();
};

export const get = <T = unknown>(endpoint: string): Promise<T> => {
  return request<T>(endpoint);
};

export const post = <T = unknown>(
  endpoint: string,
  body: unknown,
  content_type = 'application/json',
  options: RequestOptions = {},
): Promise<T> => {
  return request<T>(endpoint, 'POST', {
    headers: {
      'Content-Type': content_type,
    },
    body: body,
    ...options,
  });
};

export const patch = <T = unknown>(
  endpoint: string,
  body: unknown,
  content_type = 'application/json',
): Promise<T> => {
  return request<T>(endpoint, 'PATCH', {
    headers: {
      'Content-Type': content_type,
    },
    body: body,
  });
};

export const put = <T = unknown>(
  endpoint: string,
  body: unknown,
  content_type = 'application/json',
): Promise<T> => {
  return request<T>(endpoint, 'PUT', {
    headers: {
      'Content-Type': content_type,
    },
    body: body,
  });
};

export const del = <T = unknown>(endpoint: string): Promise<T> => {
  return request<T>(endpoint, 'DELETE');
};
