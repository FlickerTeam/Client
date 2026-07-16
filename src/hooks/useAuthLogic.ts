import { useEffect, useState } from 'react';

import { type Instance, InstanceSchema } from '@/types/instance';
import {
  DomainsResponseSchema,
  WellKnownNewResponseSchema,
  WellKnownResponseSchema,
} from '@/types/responses';

export function useAuthLogic(instance: Instance | string | undefined, customInstance: string) {
  const [instances, setInstances] = useState<Instance[] | []>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const parsed: unknown = JSON.parse(localStorage.getItem('instances') ?? '[]');
    const instances = Array.isArray(parsed) ? parsed.map((item) => InstanceSchema.parse(item)) : [];
    setInstances(instances);
  }, []);

  const isJsonResponse = (res: Response) => {
    const contentType = res.headers.get('content-type');
    return contentType?.includes('application/json');
  };

  const checkInstance = async (url?: string): Promise<{ success: boolean; apiUrl?: string }> => {
    if (!url || url === 'custom-instance') {
      setStatus(null);
      return { success: false };
    }

    setStatus('checking');

    const cleanUrl = url.replace(/^(http|https):\/\//, '').replace(/\/$/, '');
    const isTargetLocal = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1');
    const targetProtocol = isTargetLocal ? 'http:' : 'https:';
    const wellKnownUrl = `${targetProtocol}//${cleanUrl}/.well-known/spacebar`;

    try {
      let response = await fetch(wellKnownUrl + '/client');
      let isNewVersion = true;

      if (!response.ok || !isJsonResponse(response)) {
        response = await fetch(wellKnownUrl); // try again with old URL
        isNewVersion = false;

        if (!response.ok || !isJsonResponse(response)) {
          throw new Error();
        }
      }

      const jsonData = await response.json();

      let apiUrl = '';

      if (isNewVersion) {
        const metadata = WellKnownNewResponseSchema.parse(jsonData);

        apiUrl = metadata.api.baseUrl + '/api/';

        localStorage.setItem('selectedGatewayUrl', metadata.gateway.baseUrl);
        localStorage.setItem('selectedCdnUrl', metadata.cdn.baseUrl);
        localStorage.setItem('defaultApiVersion', metadata.api.apiVersions.default);

        if (metadata.api.apiVersions.default === '6') {
          localStorage.setItem('oldcordInstance', 'yes');
        }
      } else {
        const metadata = WellKnownResponseSchema.parse(jsonData);

        apiUrl = metadata.api;
      }

      if (!apiUrl.startsWith('http')) {
        apiUrl = `${targetProtocol}//${apiUrl.replace(/^\/\//, '')}`;
      }

      apiUrl = apiUrl.replace(/\/v\d+$/, '').replace(/\/$/, '');
      localStorage.setItem('selectedInstanceUrl', apiUrl);

      if (!isNewVersion) {
        const domainsRes = await fetch(`${apiUrl}/policies/instance/domains`);

        if (domainsRes.ok) {
          const domains = DomainsResponseSchema.parse(await domainsRes.json());

          localStorage.setItem('selectedGatewayUrl', domains.gateway);
          localStorage.setItem('selectedCdnUrl', domains.cdn);
          localStorage.setItem(
            'selectedAssetsUrl',
            JSON.stringify(domains.assets ?? ['https://cdn.oldcordapp.com']),
          );
          localStorage.setItem('defaultApiVersion', 'v' + domains.defaultApiVersion);

          if (domains.defaultApiVersion === '6') {
            localStorage.setItem('oldcordInstance', 'yes');
          }
        }
      }

      setStatus('valid');
      return { success: true, apiUrl };
    } catch {
      setStatus('error');
      return { success: false };
    }
  };

  useEffect(() => {
    if (instance === 'custom-instance' && customInstance.length > 3) {
      const delayDebounceFn = setTimeout(() => {
        void checkInstance(customInstance);
      }, 800);
      return () => {
        clearTimeout(delayDebounceFn);
      };
    }
    return;
  }, [customInstance, instance]);

  return { instances, status, checkInstance };
}
