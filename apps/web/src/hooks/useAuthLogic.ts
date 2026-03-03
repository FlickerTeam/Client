import { useEffect, useState } from 'react';
import { type Instance, InstanceSchema } from 'shared';
import { DomainsResponseSchema, WellKnownResponseSchema } from 'shared';

export function useAuthLogic(instance: Instance | string | undefined, customInstance: string) {
  const [instances, setInstances] = useState<Instance[] | []>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const parsed: unknown = JSON.parse(localStorage.getItem('instances') ?? '[]');
    const instances = Array.isArray(parsed) ? parsed.map((item) => InstanceSchema.parse(item)) : [];
    setInstances(instances);
  }, []);

  const checkInstance = async (url?: string) => {
    if (!url || url === 'custom-instance') {
      setStatus(null);
      return;
    }

    setStatus('checking');

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

      setStatus('valid');
    } catch {
      setStatus('error');
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
