import { type JSX, useState } from 'react';
import { Navigate } from 'react-router-dom';

import RegisterForm from '@/components/auth/registerForm';
import Brand from '@/components/common/brand';
import Footer from '@/components/common/footer';
import { useAuthLogic } from '@/hooks/useAuthLogic';
import type { Instance } from '@/types/instance';
import type { RegisterRequest } from '@/types/requests';
import { RegisterResponseSchema, RegistrationFieldErrorsSchema } from '@/types/responses';
import { post } from '@/utils/api';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function Register(): JSX.Element {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customInstance, setCustomInstance] = useState('');
  const [instance, setInstance] = useState<Instance | string>('custom-instance');
  const [usernameStatus, setUsernameStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [miscError, setMiscError] = useState<string | null>(null);

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

  if (localStorage.getItem('selectedAuthorization')) return <Navigate to='/channels/@me' />;

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

      const instanceUrl = typeof instance === 'string' ? instance : instance.url;
      const authString = btoa(`${parsed.token} ${email} ${instanceUrl}`);

      if (!localStorage.getItem('Authorizations')) {
        localStorage.setItem('Authorizations', JSON.stringify([authString]));
      } else {
        const currentAuths =
          (JSON.parse(localStorage.getItem('Authorizations') ?? '') as string[]) ?? [];

        currentAuths.push(authString);

        localStorage.setItem('Authorizations', JSON.stringify(currentAuths));
      }

      window.location.href = '/channels/@me';
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
