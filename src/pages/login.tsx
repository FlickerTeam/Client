import { type JSX, useState } from 'react';
import { Navigate } from 'react-router-dom';

import LoginForm from '@/components/auth/loginForm';
import Brand from '@/components/common/brand';
import Footer from '@/components/common/footer';
import { useAuthLogic } from '@/hooks/useAuthLogic';
import type { Instance } from '@/types/instance';
import type { LoginRequest } from '@/types/requests';
import { LoginResponseSchema } from '@/types/responses';
import { post } from '@/utils/api';

function Login(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customInstance, setCustomInstance] = useState('');
  const [instance, setInstance] = useState<Instance | string>('custom-instance');
  const [credentialsStatus, setCredentialsStatus] = useState<string | null>(null);

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

      const instanceUrl = typeof instance === 'string' ? instance : instance.url;
      const authString = btoa(`${data.token} ${email} ${instanceUrl}`);

      if (!localStorage.getItem('Authorizations')) {
        localStorage.setItem('Authorizations', JSON.stringify([authString]));
      } else {
        const currentAuths =
          (JSON.parse(localStorage.getItem('Authorizations') ?? '') as string[]) ?? [];

        currentAuths.push(authString);

        localStorage.setItem('Authorizations', JSON.stringify(currentAuths));
      }
      window.location.href = '/channels/@me';
    } catch (err) {
      setCredentialsStatus('neterror');
      console.log(err);
    }
  };

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
