import './authForm.css';

import type { ChangeEvent, Dispatch, JSX, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import type { Instance } from 'shared';

interface RegisterFormProps {
  handleSignup: () => void;
  setUsername: Dispatch<SetStateAction<string>>;
  username: string;
  instanceStatus: string | null;
  usernameStatus: string | null;
  passwordStatus: string | null;
  emailStatus: string | null;
  miscError: string | null;

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

const RegisterForm = ({
  handleInstanceSelect,
  handleSignup,
  instances,
  instance,
  instanceStatus,
  usernameStatus,
  passwordStatus,
  emailStatus,
  miscError,
  customInstance,
  setCustomInstance,
  setUsername,
  username,
  email,
  setEmail,
  password,
  setPassword,
}: RegisterFormProps): JSX.Element => {
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
      <div className='form-header'>Register an account</div>
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
        <span>Username</span>
        <input
          type='text'
          value={username}
          placeholder='Username'
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />
        {usernameStatus && (
          <span className={`status-msg ${usernameStatus}`}>
            {usernameStatus === 'checking' && 'Checking...'}
            {usernameStatus === 'error' && 'Invalid username'}
            {usernameStatus === 'valid' && ''}
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
        {emailStatus && (
          <span className={`status-msg ${emailStatus}`}>
            {emailStatus === 'checking' && 'Checking...'}
            {emailStatus === 'error' && 'Invalid email address'}
            {emailStatus === 'valid' && ''}
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
        {passwordStatus && (
          <span className={`status-msg ${passwordStatus}`}>
            {passwordStatus === 'checking' && 'Checking...'}
            {passwordStatus === 'error' && 'Bad password'}
            {passwordStatus === 'valid' && ''}
          </span>
        )}
        {miscError && <span className={`status-msg error`}>{miscError}</span>}
      </div>

      <div className='form-footer'>
        <div className='agreement'>
          <input type='checkbox' id='terms' />
          <label htmlFor='terms'>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- Add a link to the instance's T&C later*/}
            I have read the <a href='#'>Terms and Conditions</a> of this instance.
          </label>
        </div>
        <div className='actions'>
          <button className='primary-btn' onClick={handleSignup}>
            Register
          </button>
        </div>
        <Link to='/login' className='login-link'>
          Already have an account?
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;
