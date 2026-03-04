import { MobileLogin } from 'mobile-ui';
import { type JSX, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  APP_ROUTES,
  buildMeRoute,
  type Instance,
  type LoginRequest,
  LoginResponseSchema,
  post,
} from 'shared';

import LoginForm from '@/components/auth/loginForm';
import Brand from '@/components/common/brand';
import Footer from '@/components/common/footer';
import { useAuthLogic } from '@/hooks/useAuthLogic';

const normalizeHost = (rawValue: string): string => {
  const withProtocol = /^https?:\/\//.test(rawValue) ? rawValue : `https://${rawValue}`;

  try {
    return new URL(withProtocol).host;
  } catch {
    return rawValue.replace(/^https?:\/\//, '').split('/')[0] ?? rawValue;
  }
};

function Login(): JSX.Element {
  const navigate = useNavigate();
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 800px)' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customInstance, setCustomInstance] = useState('');
  const [instance, setInstance] = useState<Instance | string>('custom-instance');
  const [credentialsStatus, setCredentialsStatus] = useState<string | null>(null);
  const didHydrateInstance = useRef(false);

  const {
    instances,
    status: instanceStatus,
    checkInstance,
  } = useAuthLogic(instance, customInstance);

  const handleInstanceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUrl = e.target.value;
    const fullInstance = instances.find((i) => i.url === selectedUrl);
    setInstance(fullInstance ?? selectedUrl);
    void checkInstance(selectedUrl);
  };

  useEffect(() => {
    if (didHydrateInstance.current || instances.length === 0) return;

    const savedInstanceUrl = localStorage.getItem('selectedInstanceUrl');
    if (!savedInstanceUrl) {
      didHydrateInstance.current = true;
      return;
    }

    const savedHost = normalizeHost(savedInstanceUrl);
    const matchedInstance = instances.find(
      (candidate) => normalizeHost(candidate.url) === savedHost,
    );

    if (matchedInstance) {
      setInstance(matchedInstance);
      void checkInstance(matchedInstance.url);
    } else {
      setInstance('custom-instance');
      setCustomInstance(savedHost);
      void checkInstance(savedHost);
    }

    didHydrateInstance.current = true;
  }, [checkInstance, instances]);

  if (localStorage.getItem('selectedAuthorization')) return <Navigate to={buildMeRoute()} />;

  const handleSignin = async () => {
    try {
      setCredentialsStatus('checking');

      const loginRequest: LoginRequest = { password };
      const apiVersion = localStorage.getItem('defaultApiVersion')?.split('v')[1];

      if (apiVersion && parseInt(apiVersion) > 6) loginRequest.login = email;
      else loginRequest.email = email;

      const response = await post(`/auth/login`, loginRequest);

      const data = LoginResponseSchema.parse(response);

      if (!data.token) {
        setCredentialsStatus('error');
        return;
      }

      localStorage.setItem('selectedAuthorization', data.token);
      localStorage.setItem('selectedEmail', email);

      if (!localStorage.getItem('Authorizations')) {
        localStorage.setItem('Authorizations', JSON.stringify([data.token]));
      } else {
        const currentAuths =
          (JSON.parse(localStorage.getItem('Authorizations') ?? '') as string[]) ?? [];
        currentAuths.push(data.token);

        localStorage.setItem('Authorizations', JSON.stringify(currentAuths));
      }
      window.location.href = buildMeRoute();
    } catch (err) {
      setCredentialsStatus('neterror');
      console.log(err);
    }
  };

  const mapCredentialsStatus = (status: string | null): string | null => {
    if (!status) return null;
    if (status === 'checking') return 'Logging in...';
    if (status === 'error') return 'Invalid email or password';
    if (status === 'neterror') return 'A network error occurred';
    return null;
  };

  const mapInstanceStatus = (status: string | null): string | null => {
    if (!status) return null;
    if (status === 'checking') return 'Checking...';
    if (status === 'error') return 'Invalid instance or connection error';
    if (status === 'valid') return 'Instance is online';
    return null;
  };

  if (isTabletOrMobile) {
    return (
      <MobileLogin
        instances={instances}
        selectedInstanceUrl={typeof instance === 'object' ? instance.url : instance}
        customInstance={customInstance}
        instanceStatus={mapInstanceStatus(instanceStatus)}
        onSelectInstance={(url) => {
          const fullInstance = instances.find((i) => i.url === url);
          setInstance(fullInstance ?? url);
          void checkInstance(url);
        }}
        onChangeCustomInstance={setCustomInstance}
        email={email}
        password={password}
        onChangeEmail={setEmail}
        onChangePassword={setPassword}
        onSubmit={() => {
          void handleSignin();
        }}
        onOpenRegister={() => {
          void navigate(APP_ROUTES.register);
        }}
        status={mapCredentialsStatus(credentialsStatus)}
      />
    );
  }

  return (
    <div className='page-wrapper'>
      <Brand />
      <div className='center'>
        <LoginForm
          handleInstanceSelect={handleInstanceSelect}
          handleSignin={() => void handleSignin()}
          instances={instances}
          instance={instance}
          customInstance={customInstance}
          setCustomInstance={setCustomInstance}
          email={email}
          setEmail={setEmail}
          password={password}
          instanceStatus={instanceStatus}
          credentialsStatus={credentialsStatus}
          setPassword={setPassword}
        />
      </div>
      <Footer />
    </div>
  );
}

export default Login;
