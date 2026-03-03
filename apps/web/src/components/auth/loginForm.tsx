import './authForm.css';

import type { ChangeEvent, Dispatch, JSX, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import type { Instance } from 'shared';

interface LoginFormProps {
  handleSignin: () => void;
  instanceStatus: string | null;
  credentialsStatus: string | null;

  handleInstanceSelect: (event: ChangeEvent<HTMLSelectElement>) => void;
  instances: Instance[] | [];
  instance: string | Instance | undefined;
  customInstance: string;
  setCustomInstance: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
}

const LoginForm = ({
  handleInstanceSelect,
  handleSignin,
  instances,
  instance,
  customInstance,
  setCustomInstance,
  instanceStatus,
  credentialsStatus,
  email,
  setEmail,
  password,
  setPassword,
}: LoginFormProps): JSX.Element => {
  const renderInstanceStatus = () => {
    if (instanceStatus)
      return (
        <span className={`status-msg ${instanceStatus}`}>
          {instanceStatus === 'checking' && 'Checking...'}
          {instanceStatus === 'error' && 'Invalid instance or connection error'}
          {instanceStatus === 'valid' && 'Instance is online'}
        </span>
      );
    else return <></>;
  };

  return (
    <div className='register-form'>
      <div className='form-header'>Login to an account</div>
      <div className='form-body'>
        <span>Instance</span>
        <select
          value={typeof instance === 'object' ? instance.url : (instance ?? 'custom-instance')}
          onChange={handleInstanceSelect}
        >
          {instances.map((instance) => (
            <option key={instance.url} value={instance.url}>
              {instance.name}
            </option>
          ))}
          <option key={'custom'} value={'custom-instance'}>
            Custom Instance
          </option>
        </select>
        {instance !== 'custom-instance' && renderInstanceStatus()}
        {instance === 'custom-instance' && (
          <>
            <span>Instance URL</span>
            <input
              type='text'
              value={customInstance}
              placeholder='example.com'
              onChange={(e) => {
                setCustomInstance(e.target.value);
              }}
            />
            {renderInstanceStatus()}
          </>
        )}
        <span>Email</span>
        <input
          type='email'
          value={email}
          placeholder='Email'
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <span>Password</span>
        <input
          type='password'
          value={password}
          placeholder='Password'
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        {credentialsStatus && (
          <span className={`status-msg ${credentialsStatus}`}>
            {credentialsStatus === 'checking' && 'Logging in...'}
            {credentialsStatus === 'error' && 'Invalid email or password'}
            {credentialsStatus === 'neterror' && 'A network error occurred'}
          </span>
        )}
      </div>
      <div className='form-footer'>
        <div className='actions'>
          <button className='primary-btn' onClick={handleSignin}>
            Login
          </button>
        </div>
        <Link to='/register' className='login-link'>
          Don&rsquo;t have an account?
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
