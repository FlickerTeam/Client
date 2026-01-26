import { type JSX, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthLogic } from '@/hooks/useAuthLogic';
import type { Instance } from '@/types/instance';
import type { LoginRequest } from '@/types/requests';
import { LoginResponseSchema } from '@/types/responses';

import LoginForm from '../components/auth/loginForm';
import Brand from '../components/common/brand';
import Footer from '../components/common/footer';

function Login(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customInstance, setCustomInstance] = useState('');
  const [instance, setInstance] = useState<Instance | string | undefined>(undefined);

  const { instances, status, setStatus, errorMsg, checkInstance } = useAuthLogic(
    instance,
    customInstance,
  );

  const handleInstanceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUrl = e.target.value;
    const fullInstance = instances.find((i) => i.url === selectedUrl);
    setInstance(fullInstance ?? selectedUrl);
    if (selectedUrl !== 'custom-instance') {
      void checkInstance(selectedUrl);
    } else {
      setStatus((prev) => ({ ...prev, instance: null }));
    }
  };

  if (localStorage.getItem('Authorization')) return <Navigate to='/' />;

  const handleSignin = async () => {
    try {
      const loginRequest: LoginRequest = { password };
      const apiVersion = localStorage.getItem('defaultApiVersion')?.split('v')[1];

      if (apiVersion && parseInt(apiVersion) > 6) loginRequest.login = email;
      else loginRequest.email = email;

      const response = await fetch(
        `${localStorage.getItem('selectedInstanceUrl') ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginRequest),
        },
      );

      if (!response.ok) return;
      const data = LoginResponseSchema.parse(await response.json());
      if (!data.token) return;

      localStorage.setItem('Authorization', data.token);
      window.location.href = '/';
    } catch (err) {
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
          errorMsg={errorMsg}
          status={status}
          setPassword={setPassword}
        />
      </div>
      <Footer />
    </div>
  );
}

export default Login;
