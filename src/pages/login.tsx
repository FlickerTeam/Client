import { type JSX, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import LoginForm from '../components/auth/loginForm';
import Brand from '../components/common/brand';
import Footer from '../components/common/footer';

function Login(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [instance, setInstance] = useState<Instance | null | string>('');
  const [customInstance, setCustomInstance] = useState('');
  const [instances, setInstances] = useState<Instance[] | []>([]);
  const [errorMsg, setErrorMsg] = useState({});
  const [status, setStatus] = useState<ErrorStatusFields>({
    instance: null,
    email: null,
    password: null,
  });

  useEffect(() => {
    const instances_: Instance[] = JSON.parse(localStorage.getItem('instances')!);

    setInstances(instances_);
    setInstance(instances_[0]);
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

      const metadata = await response.json();

      if (!metadata?.api) throw new Error();

      let apiUrl = metadata.api;

      if (!apiUrl.startsWith('http')) {
        apiUrl = `${targetProtocol}//${apiUrl.replace(/^\/\//, '')}`;
      }

      apiUrl = apiUrl.replace(/\/v\d+$/, '');
      apiUrl = apiUrl.replace(/\/$/, '');

      localStorage.setItem('selectedInstanceUrl', apiUrl);

      const domainsRes = await fetch(`${apiUrl}/policies/instance/domains`);

      if (domainsRes.ok) {
        const domains = await domainsRes.json();

        localStorage.setItem('selectedGatewayUrl', domains.gateway);
        localStorage.setItem('selectedCdnUrl', domains.cdn);
        localStorage.setItem('selectedAssetsUrl', domains.assets ?? domains.cdn);
        localStorage.setItem('defaultApiVersion', 'v' + domains.defaultApiVersion);
      }

      setStatus((prev) => ({ ...prev, instance: 'valid' }));
    } catch (error) {
      console.error('Instance validation failed', error);

      setStatus((prev) => ({ ...prev, instance: 'error' }));
      setErrorMsg((prev) => ({ ...prev, instance: 'Invalid instance or connection error' }));
    }
  };

  useEffect(() => {
    if (instance === 'custom-instance' && customInstance.length > 3) {
      const delayDebounceFn = setTimeout(() => {
        checkInstance(customInstance);
      }, 800);

      return () => {
        clearTimeout(delayDebounceFn);
      };
    }
  }, [customInstance, instance]);

  const handleInstanceSelect = (e: any) => {
    const selected = e.target.value;

    setInstance(selected);

    if (selected !== 'custom-instance') {
      checkInstance(selected);
    } else {
      setStatus((prev) => ({ ...prev, instance: null }));
    }
  };

  const Authorization = localStorage.getItem('Authorization');

  if (Authorization) {
    return <Navigate to='/' />;
  }

  const handleSignin = async () => {
    try {
      const loginRequest: LoginRequest = {
        password: password,
      };

      const apiVersion = localStorage.getItem('defaultApiVersion')?.split('v')[1]; //6

      if (apiVersion && parseInt(apiVersion) > 6) {
        loginRequest.login = email;
      } else {
        loginRequest.email = email;
      }

      const response = await fetch(
        `${localStorage.getItem('selectedInstanceUrl')}/${localStorage.getItem('defaultApiVersion')}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginRequest),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      if (!data.token) {
        return;
      }

      localStorage.setItem('Authorization', data.token);

      window.location.href = '/';
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div className='page-wrapper'>
        <Brand />
        <div className='center'>
          <LoginForm
            handleInstanceSelect={handleInstanceSelect}
            handleSignin={handleSignin}
            instances={instances}
            instance={instance}
            customInstance={customInstance}
            setCustomInstance={setCustomInstance}
            email={email}
            setEmail={setEmail}
            password={password}
            errorMsg={errorMsg}
            status={status}
            setPassword={setPassword}
          />
        </div>
        <Footer />
      </div>
    </>
  );
}

export default Login;
