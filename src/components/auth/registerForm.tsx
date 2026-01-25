import './authform.css';

import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import type { ErrorStatusFields } from '@/types/errorStatusFields';
import type { Instance } from '@/types/instance';

const RegisterForm = ({
  handleInstanceSelect,
  handleSignup,
  instances,
  instance,
  errorMsg,
  status,
  customInstance,
  setCustomInstance,
  setUsername,
  username,
  email,
  setEmail,
  password,
  setPassword,
}: {
  handleInstanceSelect: any;
  handleSignup: any;
  instances: Instance[] | [];
  instance: any;
  errorMsg: any;
  status: ErrorStatusFields;
  customInstance: any;
  setCustomInstance: any;
  setUsername: any;
  username: string;
  email: string;
  setEmail: any;
  password: string;
  setPassword: any;
}): JSX.Element => {
  const renderStatus = () => {
    if (!status.instance) return null;
    return (
      <span className={`status-msg ${status.instance}`}>
        {status.instance === 'checking' && 'Checking...'}
        {status.instance === 'error' && (errorMsg.instance || 'Request timed out')}
        {status.instance === 'valid' && 'Instance is online'}
      </span>
    );
  };

  return (
    <div className='register-form'>
      <div className='form-header'>Register an account</div>
      <div className='form-body'>
        <span>Instance</span>
        <select value={instance} onChange={handleInstanceSelect}>
          {instances.map((instance) => (
            <option key={instance.url} value={instance.url}>
              {instance.name}
            </option>
          ))}
          <option key={'custom'} value={'custom-instance'}>
            Custom Instance
          </option>
        </select>
        {instance !== 'custom-instance' && renderStatus()}
        {instance === 'custom-instance' && (
          <>
            <span>Instance URL</span>
            <input
              type='text'
              value={customInstance}
              placeholder='example.com'
              onChange={(e) => setCustomInstance(e.target.value)}
            />
            {renderStatus()}
          </>
        )}
        <span>Username</span>
        <input
          type='text'
          value={username}
          placeholder='Username'
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />
        {status.username && (
          <span className={`status-msg ${status.username}`}>
            {status.username === 'error' && errorMsg.username}
          </span>
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
        {status.email && (
          <span className={`status-msg ${status.email}`}>
            {status.email === 'error' && errorMsg.email}
          </span>
        )}
        <span>Password</span>
        <input
          type='password'
          value={password}
          placeholder='Password'
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        {status.password && (
          <span className={`status-msg ${status.password}`}>
            {status.password === 'checking' && 'Signing up...'}
            {status.password === 'error' && errorMsg.password}
          </span>
        )}
      </div>

      <div className='form-footer'>
        <div className='agreement'>
          <input type='checkbox' id='terms' />
          <label htmlFor='terms'>
            I have read the <a href='#'>Terms and Conditions</a> of this instance.
          </label>
        </div>
        <div className='actions'>
          <button onClick={handleSignup}>Register</button>
        </div>
        <Link to='/login' className='login-link'>
          Already have an account?
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;
