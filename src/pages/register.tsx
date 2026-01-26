import { type JSX, useState } from 'react';
import { Navigate } from 'react-router-dom';
import * as z from 'zod';

import { useAuthLogic } from '@/hooks/useAuthLogic';
import { ErrorMsgSchema } from '@/types/authFormProps';
import type { ErrorStatusFields } from '@/types/errorStatusFields';
import type { Instance } from '@/types/instance';
import type { RegisterRequest } from '@/types/requests';
import { ErrorResponseSchema, RegisterResponseSchema } from '@/types/responses';

import RegisterForm from '../components/auth/registerForm';
import Brand from '../components/common/brand';
import Footer from '../components/common/footer';

function Register(): JSX.Element {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customInstance, setCustomInstance] = useState('');
  const [instance, setInstance] = useState<Instance | string | undefined>(undefined);
  const [showPreview, setShowPreview] = useState(false);

  const { instances, status, setStatus, errorMsg, setErrorMsg, checkInstance } = useAuthLogic(
    instance,
    customInstance,
  );

  const handleInstanceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setInstance(selected);
    if (selected !== 'custom-instance') void checkInstance(selected);
    else setStatus((prev) => ({ ...prev, instance: null }));
  };

  if (localStorage.getItem('Authorization')) return <Navigate to='/' />;

  const handleSignup = async () => {
    setErrorMsg({
      username: false,
      email: false,
    });
    setStatus({ instance: 'valid', username: null, email: null, password: null });

    try {
      const registerRequest: RegisterRequest = {
        username,
        password,
        email,
        date_of_birth: '1999-01-01',
        consent: true,
      };

      const response = await fetch(
        `${localStorage.getItem('selectedInstanceUrl') ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerRequest),
        },
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        const parsed = ErrorResponseSchema.loose().parse(data);
        const newErrors: Record<string, unknown> = {};
        const newStatus: ErrorStatusFields = { ...status };
        const errorKeys = Object.keys(parsed).filter((k) => k !== 'code' && k !== 'message');

        if (errorKeys.length > 0) {
          errorKeys.forEach((key) => {
            const fieldKey = key as keyof ErrorStatusFields;
            newErrors[key] = parsed[key];
            newStatus[fieldKey] = 'error';
          });
        } else if (parsed.message) {
          newErrors.password = parsed.message;
          newStatus.password = 'error';
        }

        setErrorMsg(ErrorMsgSchema.parse(newErrors));
        setStatus(newStatus);
        return;
      }

      const parsed = RegisterResponseSchema.parse(data);

      localStorage.setItem('Authorization', parsed.token);
      localStorage.setItem('email', email);
      window.location.href = '/';
    } catch (err) {
      const parsedErr = z.string().parse(err);

      setStatus((prev) => ({ ...prev, password: 'error' }));
      setErrorMsg((prev) => ({ ...prev, password: parsedErr }));
    }
  };

  return (
    <div className='page-wrapper'>
      <Brand />
      <div className='center'>
        <RegisterForm
          handleInstanceSelect={handleInstanceSelect}
          handleSignup={() => void handleSignup}
          instances={instances}
          setUsername={setUsername}
          username={username}
          email={email}
          instance={instance}
          status={status}
          errorMsg={errorMsg}
          setEmail={setEmail}
          password={password}
          customInstance={customInstance}
          setCustomInstance={setCustomInstance}
          setPassword={setPassword}
        />
        <button
          className={`preview-tab ${showPreview ? 'active' : ''}`}
          onClick={() => {
            setShowPreview(!showPreview);
          }}
        >
          {showPreview ? 'Close Preview' : 'Preview Account'}
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default Register;
