import { Link } from 'react-router-dom';
import './authform.css'
import { Instance } from '../../interfaces/instance';
import { ErrorStatusFields } from '../../interfaces/errorstatusfields';
import { JSX } from 'react';

const LoginForm = ({ handleInstanceSelect, handleSignin, instances, instance, errorMsg, status, email, setEmail, password, setPassword } : {
    handleSignin: any,
    handleInstanceSelect: any,
    instances: Instance[] | [],
    instance: any,
    errorMsg: any,
    status: ErrorStatusFields,
    email: string,
    setEmail: any,
    password: string,
    setPassword: any,
}) : JSX.Element => {
    return (
        <div className="register-form">
            <div className="form-header">
                Login to an account
            </div>
            <div className="form-body">
                <span>Instance</span>
                <select value={instance} onChange={handleInstanceSelect}>
                    {instances.map((instance) => (
                        <option key={instance.url} value={instance.url}>
                            {instance.name}
                        </option>
                    ))}
                </select>
                {status.instance && (
                    <span className={`status-msg ${status.instance}`}>
                        {status.instance === 'checking' && "Checking..."}
                        {status.instance === 'error' && errorMsg.instance}
                        {status.instance === 'valid' && "Instance is online"}
                    </span>
                )}
                <span>Email</span>
                <input type="email" value={email} placeholder="Email" onChange={(e) => {
                    setEmail(e.target.value);
                }} />
                <span>Password</span>
                <input type="password" value={password} placeholder="Password" onChange={(e) => {
                    setPassword(e.target.value);
                }} />
                {status.password && (
                    <span className={`status-msg ${status.password}`}>
                        {status.password === 'checking' && "Logging in..."}
                        {status.password === 'error' && errorMsg.password }
                    </span>
                )}
            </div>
            <div className="form-footer">
                <div className="actions">
                    <button onClick={handleSignin}>Login</button>
                </div>
                <Link to="/register" className="login-link">Don't have an account?</Link>
            </div>
        </div>
    )
};

export default LoginForm;