import './switchAccount.css';

import { type JSX, useState } from 'react';
import { useAuthLogic } from '@/hooks/useAuthLogic';
import type { Instance } from '@/types/instance';
import type { LoginRequest, RegisterRequest } from '@/types/requests';
import { LoginResponseSchema, RegisterResponseSchema } from '@/types/responses';
import { post } from '@/utils/api';
import LoginForm from '../auth/loginForm';
import RegisterForm from '../auth/registerForm';

const parseAuthorization = (
  authorization: string,
): {
  token: string;
  email: string;
  instanceUrl: string;
} | null => {
  try {
    const decoded = atob(authorization);
    const parts = decoded.split(' ');
    const token = parts[0];
    const email = parts[1];
    const instanceUrl = parts[2];

    if (!token || !email || !instanceUrl) {
      return null;
    }

    return {
      token: token,
      email: email,
      instanceUrl: instanceUrl,
    };
  } catch {
    return null;
  }
};

export const SwitchAccountModal = (): JSX.Element => {
  const [view, setView] = useState<'list' | 'login' | 'register'>('list');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [customInstance, setCustomInstance] = useState('');
  const [instance, setInstance] = useState<Instance | string>('custom-instance');
  const [credentialsStatus, setCredentialsStatus] = useState<string | null>(null);
  const selectedToken = localStorage.getItem('selectedAuthorization');
  const [authorizations, setAuthorizations] = useState<string[]>(
    () => JSON.parse(localStorage.getItem('Authorizations') ?? '[]') as string[],
  );
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);

  const {
    instances,
    status: instanceStatus,
    checkInstance,
  } = useAuthLogic(instance, customInstance);

  const parsedAuthorizations = authorizations
    .map((auth) => parseAuthorization(auth))
    .filter((parsed): parsed is Exclude<typeof parsed, null> => parsed !== null);

  const handleInstanceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUrl = e.target.value;
    const fullInstance = instances.find((i) => i.url === selectedUrl);

    setInstance(fullInstance ?? selectedUrl);

    void checkInstance(selectedUrl);
  };

  const handleRemoveAccount = (e: React.MouseEvent, tokenToRemove: string) => {
    e.stopPropagation();

    const updatedRawAuths = authorizations.filter((auth) => {
      const parsed = parseAuthorization(auth);
      return parsed ? parsed.token !== tokenToRemove : false;
    });

    setAuthorizations(updatedRawAuths);

    localStorage.setItem('Authorizations', JSON.stringify(updatedRawAuths));

    if (tokenToRemove == selectedToken) {
      localStorage.removeItem('selectedAuthorization');
      localStorage.removeItem('selectedEmail');
      localStorage.removeItem('selectedInstanceUrl');
      localStorage.removeItem('selectedGatewayUrl');
      localStorage.removeItem('selectedCdnUrl');
      localStorage.removeItem('selectedAssetsUrl');
      location.reload();
    }
  };

  const handleSelectAccount = (token: string, emailStr: string, instanceUrlStr: string) => {
    localStorage.setItem('selectedAuthorization', token);
    localStorage.setItem('selectedEmail', emailStr);
    localStorage.setItem('selectedInstanceUrl', instanceUrlStr);

    window.location.reload();
  };

  const maskEmail = (email: string): string => {
    const [localPart, domainPart] = email.split('@');
    if (!localPart || !domainPart) return email;

    const maskedLocal = localPart.length > 0 ? `${localPart[0]}*` : '*';
    const domainPieces = domainPart.split('.');
    const maskedDomain = domainPieces
      .map((piece, index) => {
        if (index === 0 && piece.length > 0) {
          return `${piece[0]}*`;
        }
        return piece;
      })
      .join('.');

    return `${maskedLocal}@${maskedDomain}`;
  };

  const handleSignin = async () => {
    try {
      setCredentialsStatus('checking');

      const selectedUrl = typeof instance === 'string' ? instance : instance.url;
      const targetUrl = selectedUrl === 'custom-instance' ? customInstance : selectedUrl;
      const result = await checkInstance(targetUrl);

      if (!result.success || !result.apiUrl) {
        setCredentialsStatus('neterror');
        return;
      }

      const loginRequest: LoginRequest = { password };
      const apiVersion = localStorage.getItem('defaultApiVersion')?.split('v')[1];

      if (apiVersion && parseInt(apiVersion) > 6) loginRequest.login = email;
      else loginRequest.email = email;

      const targetInstanceUrl = localStorage.getItem('selectedInstanceUrl') ?? '';

      const response = await post(`/auth/login`, loginRequest, 'application/json', {
        baseUrl: targetInstanceUrl,
      });

      const data = LoginResponseSchema.parse(response);

      if (!data.token) {
        setCredentialsStatus('error');
        return;
      }

      const authString = btoa(`${data.token} ${email} ${targetInstanceUrl}`);
      const updatedAuths = [...authorizations, authString];

      setAuthorizations(updatedAuths);

      localStorage.setItem('Authorizations', JSON.stringify(updatedAuths));
      localStorage.setItem('selectedAuthorization', data.token);
      localStorage.setItem('selectedEmail', email);
      localStorage.setItem('selectedInstanceUrl', result.apiUrl);

      setEmail('');
      setPassword('');
      setCredentialsStatus(null);
      setView('list');
    } catch (err) {
      setCredentialsStatus('neterror');
      console.error(err);
    }
  };

  const handleSignup = async () => {
    try {
      const selectedUrl = typeof instance === 'string' ? instance : instance.url;
      const targetUrl = selectedUrl === 'custom-instance' ? customInstance : selectedUrl;
      const result = await checkInstance(targetUrl);

      if (!result.success || !result.apiUrl) {
        setCredentialsStatus('Invalid instance or connection error');
        return;
      }

      const registerRequest: RegisterRequest = {
        username,
        password,
        email,
        date_of_birth: '1999-01-01',
        consent: true,
      };

      const targetInstanceUrl = localStorage.getItem('selectedInstanceUrl') ?? '';

      const response = await post(`/auth/register`, registerRequest, 'application/json', {
        baseUrl: targetInstanceUrl,
      });

      const parsed = RegisterResponseSchema.parse(response);

      const authString = btoa(`${parsed.token} ${email} ${targetInstanceUrl}`);
      const updatedAuths = [...authorizations, authString];

      setAuthorizations(updatedAuths);

      localStorage.setItem('Authorizations', JSON.stringify(updatedAuths));
      localStorage.setItem('selectedAuthorization', parsed.token);
      localStorage.setItem('selectedEmail', email);
      localStorage.setItem('selectedInstanceUrl', result.apiUrl);

      setUsername('');
      setEmail('');
      setPassword('');
      setView('list');
    } catch (err) {
      setCredentialsStatus('neterror');
      console.error(err);
    }
  };

  if (view === 'login') {
    return (
      <div className='set-custom-status-modal center-form-wrapper'>
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
        <div className='inline-form-nav'>
          <button className='secondary-text-btn' onClick={() => setView('list')}>
            ← Back to Accounts
          </button>
          <button className='secondary-text-btn' onClick={() => setView('register')}>
            Need an account? Register
          </button>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className='set-custom-status-modal center-form-wrapper'>
        <RegisterForm
          handleInstanceSelect={handleInstanceSelect}
          handleSignup={handleSignup}
          instances={instances}
          instance={instance}
          instanceStatus={instanceStatus}
          usernameStatus={null}
          passwordStatus={null}
          emailStatus={null}
          miscError={null}
          customInstance={customInstance}
          setCustomInstance={setCustomInstance}
          setUsername={setUsername}
          username={username}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
        <div className='inline-form-nav'>
          <button className='secondary-text-btn' onClick={() => setView('login')}>
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='set-custom-status-modal'>
      <h2>What's your favorite account?</h2>

      <div className='server-fields'>
        <div className='accounts-list'>
          {parsedAuthorizations.map((parsedAuth) => {
            let domain = parsedAuth.instanceUrl;
            try {
              domain = new URL(parsedAuth.instanceUrl).hostname;
            } catch {
              // Fallback
            }

            const isCurrent = parsedAuth.token === selectedToken;
            const isHovered = parsedAuth.token === hoveredToken;

            return (
              <div
                key={parsedAuth.token}
                className={`account-item ${isCurrent ? 'active' : ''}`}
                onMouseEnter={() => setHoveredToken(parsedAuth.token)}
                onMouseLeave={() => setHoveredToken(null)}
                onClick={() =>
                  handleSelectAccount(parsedAuth.token, parsedAuth.email, parsedAuth.instanceUrl)
                }
              >
                <div className='account-details'>
                  <span className='account-email'>
                    {isHovered ? parsedAuth.email : maskEmail(parsedAuth.email)}
                  </span>
                  <span className='account-domain'>{domain}</span>
                </div>

                <div className='account-actions'>
                  {isCurrent && <span className='current-badge'>Current</span>}
                  <button
                    className='remove-account-btn'
                    onClick={(e) => handleRemoveAccount(e, parsedAuth.token)}
                    title='Remove account'
                  >
                    −
                  </button>
                </div>
              </div>
            );
          })}
          {parsedAuthorizations.length === 0 && (
            <p className='empty-accounts-hint'>No linked accounts found. Add one below!</p>
          )}
        </div>
      </div>

      <div className='modal-footer modal-footer-status'>
        <button className='primary-btn' onClick={() => setView('login')}>
          Add Account
        </button>
      </div>
    </div>
  );
};
