import { useEffect, useState } from 'react';

import type { ErrorMsg } from '@/types/authFormProps';
import type { ErrorStatusFields } from '@/types/errorStatusFields';
import { type Instance, InstanceSchema } from '@/types/instance';
import { DomainsResponseSchema, WellKnownResponseSchema } from '@/types/responses';

export function useAuthLogic(instance: Instance | string | undefined, customInstance: string) {
  const [instances, setInstances] = useState<Instance[] | []>([]);
  const [status, setStatus] = useState<ErrorStatusFields>({
    instance: null,
    email: null,
    password: null,
    username: null,
  });
  const [errorMsg, setErrorMsg] = useState<ErrorMsg>({
    username: false,
    email: false,
  });

  useEffect(() => {
    const parsed: unknown = JSON.parse(localStorage.getItem('instances') ?? '[]');
    const instances = Array.isArray(parsed) ? parsed.map((item) => InstanceSchema.parse(item)) : [];
    setInstances(instances);
  }, []);

  const checkInstance = async (url: string) => {
    if (!url) return;

    setStatus((prev) => ({ ...prev, instance: 'checking' }));

    const cleanUrl = url.replace(/^(http|https):\/\//, '').replace(/\/$/, '');
    const isTargetLocal = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1');
    const targetProtocol = isTargetLocal ? 'http:' : 'https:';
    const wellKnownUrl = `${targetProtocol}//${cleanUrl}/.well-known/spacebar`;

    try {
      const response = await fetch(wellKnownUrl);

      if (!response.ok) throw new Error();

      const metadata = WellKnownResponseSchema.safeParse(await response.json());

      if (metadata.error) throw new Error();

      let apiUrl = metadata.data.api;

      if (!apiUrl.startsWith('http')) {
        apiUrl = `${targetProtocol}//${apiUrl.replace(/^\/\//, '')}`;
      }

      apiUrl = apiUrl.replace(/\/v\d+$/, '').replace(/\/$/, '');

      localStorage.setItem('selectedInstanceUrl', apiUrl);

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
      }

      setStatus((prev) => ({ ...prev, instance: 'valid' }));
    } catch {
      setStatus((prev) => ({ ...prev, instance: 'error' }));
      setErrorMsg((prev) => ({ ...prev, instance: 'Invalid instance or connection error' }));
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

  return { instances, status, setStatus, errorMsg, setErrorMsg, checkInstance };
}
