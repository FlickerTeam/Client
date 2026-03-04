import { MobileRegister } from 'mobile-ui';
import { type JSX, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  APP_ROUTES,
  buildMeRoute,
  type Instance,
  post,
  type RegisterRequest,
  RegisterResponseSchema,
  RegistrationFieldErrorsSchema,
} from 'shared';

import RegisterForm from '@/components/auth/registerForm';
import Brand from '@/components/common/brand';
import Footer from '@/components/common/footer';
import { useAuthLogic } from '@/hooks/useAuthLogic';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeHost = (rawValue: string): string => {
  const withProtocol = /^https?:\/\//.test(rawValue) ? rawValue : `https://${rawValue}`;

  try {
    return new URL(withProtocol).host;
  } catch {
    return rawValue.replace(/^https?:\/\//, '').split('/')[0] ?? rawValue;
  }
};

function Register(): JSX.Element {
  const navigate = useNavigate();
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 800px)' });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customInstance, setCustomInstance] = useState('');
  const [instance, setInstance] = useState<Instance | string>('custom-instance');
  const [usernameStatus, setUsernameStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [miscError, setMiscError] = useState<string | null>(null);
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

  const handleSignup = async () => {
    setUsernameStatus(null);
    setPasswordStatus(null);
    setEmailStatus(null);

    try {
      const registerRequest: RegisterRequest = {
        username,
        password,
        email,
        date_of_birth: '1999-01-01',
        consent: true,
      };

      const response = await post(`/auth/register`, registerRequest);
      const parsed = RegisterResponseSchema.parse(response);

      localStorage.setItem('selectedAuthorization', parsed.token);
      localStorage.setItem('selectedEmail', email);

      if (!localStorage.getItem('Authorizations')) {
        localStorage.setItem('Authorizations', JSON.stringify([parsed.token]));
      } else {
        const currentAuths =
          (JSON.parse(localStorage.getItem('Authorizations') ?? '') as string[]) ?? [];
        currentAuths.push(parsed.token);

        localStorage.setItem('Authorizations', JSON.stringify(currentAuths));
      }

      window.location.href = buildMeRoute();
    } catch (err: unknown) {
      try {
        const responseBody = isRecord(err) ? err.responseBody : undefined;
        const fieldErrors = RegistrationFieldErrorsSchema.parse(responseBody);

        setUsernameStatus(fieldErrors.username ? 'error' : null);
        setPasswordStatus(fieldErrors.password ? 'error' : null);
        setEmailStatus(fieldErrors.email ? 'error' : null);
      } catch {
        const message = isRecord(err) && typeof err.message === 'string' ? err.message : null;
        setMiscError(message || 'An error occurred while registering');
      }
      console.error(err);
    }
  };

  const mobileStatus =
    miscError ??
    (usernameStatus === 'error'
      ? 'Invalid username'
      : emailStatus === 'error'
        ? 'Invalid email'
        : passwordStatus === 'error'
          ? 'Bad password'
          : null);

  const mapInstanceStatus = (status: string | null): string | null => {
    if (!status) return null;
    if (status === 'checking') return 'Checking...';
    if (status === 'error') return 'Invalid instance or connection error';
    if (status === 'valid') return 'Instance is online';
    return null;
  };

  if (isTabletOrMobile) {
    return (
      <MobileRegister
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
        username={username}
        email={email}
        password={password}
        onChangeUsername={setUsername}
        onChangeEmail={setEmail}
        onChangePassword={setPassword}
        onSubmit={() => {
          void handleSignup();
        }}
        onOpenLogin={() => {
          void navigate(APP_ROUTES.login);
        }}
        status={mobileStatus}
      />
    );
  }

  return (
    <div className='page-wrapper'>
      <Brand />
      <div className='center'>
        <RegisterForm
          handleInstanceSelect={handleInstanceSelect}
          handleSignup={() => void handleSignup()}
          instances={instances}
          setUsername={setUsername}
          username={username}
          email={email}
          instance={instance}
          instanceStatus={instanceStatus}
          usernameStatus={usernameStatus}
          passwordStatus={passwordStatus}
          emailStatus={emailStatus}
          miscError={miscError}
          setEmail={setEmail}
          password={password}
          customInstance={customInstance}
          setCustomInstance={setCustomInstance}
          setPassword={setPassword}
        />
      </div>
      <Footer />
    </div>
  );
}

export default Register;
