import { JSX, useEffect, useState } from "react";
import Footer from "../components/common/footer";
import Brand from "../components/common/brand";
import RegisterForm from "../components/auth/registerform";
import { Navigate } from "react-router-dom";
import { Instance } from "../interfaces/instance";
import { RegisterRequest } from "../interfaces/registerrequest";
import { ErrorStatusFields } from "../interfaces/errorstatusfields";

function Register(): JSX.Element {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [customInstance, setCustomInstance] = useState("");
    const [instance, setInstance] = useState<Instance | null | string>(null);
    const [instances, setInstances] = useState<Instance[] | []>([]);
    const [status, setStatus] = useState<ErrorStatusFields>({
        instance: null,
        username: null,
        email: null,
        password: null
    });

    const [showPreview, setShowPreview] = useState(false);
    const [errorMsg, setErrorMsg] = useState({});

    useEffect(() => {
        let instances_: Instance[] = JSON.parse(localStorage.getItem("instances")!);

        setInstances(instances_);
        setInstance(instances_[0]);
    }, []);

    const checkInstance = async (url: string) => {
        if (!url) return;
        
        setStatus(prev => ({ ...prev, instance: 'checking' }));

        const hasProtocol = /^(http|https):\/\//.test(url);
        const finalUrl = hasProtocol ? `${url}/.well-known/spacebar` : `${window.location.protocol}//${url}/.well-known/spacebar`;

        try {
            const response = await fetch(finalUrl);

            if (!response.ok) {
                throw new Error();
            }

            let metadata = await response.json();

            if (!metadata || !metadata.api) throw new Error();

            localStorage.setItem("selectedInstanceUrl", metadata.api);

            setStatus(prev => ({ ...prev, instance: 'valid' }));
        } catch (error) {
            setStatus(prev => ({ ...prev, instance: 'error' }));
            setErrorMsg(prev => ({ ...prev, instance: 'Request timed out' }));
        }
    };

    useEffect(() => {
        if (instance === 'custom-instance' && customInstance.length > 3) {
            const delayDebounceFn = setTimeout(() => {
                checkInstance(customInstance);
            }, 800);

            return () => clearTimeout(delayDebounceFn);
        }
    }, [customInstance, instance]);

    let authToken = localStorage.getItem('Authorization');

    if (authToken) {
        return <Navigate to="/" />;
    }

    const handleInstanceSelect = (e: any) => {
        const selected = e.target.value;

        setInstance(selected);

        if (selected !== 'custom-instance') {
            checkInstance(selected);
        } else {
            setStatus(prev => ({ ...prev, instance: null }));
        }
    };

    const handleSignup = async () => {
        setErrorMsg({});
        setStatus({ instance: 'valid', username: null, email: null, password: null });

        try {
            const registerRequest: RegisterRequest = {
                username: username,
                password: password,
                date_of_birth: "1999-01-01",
                consent: true,
                email: email
            };

            const response = await fetch(`${localStorage.getItem('selectedInstanceUrl')}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerRequest)
            });

            const data = await response.json();

            if (!response.ok) {
                const newErrors: any = {}; //to-do
                const newStatus: any = { ...status }; //to-do

                const errorKeys = Object.keys(data).filter(k => k !== 'code' && k !== 'message');

                if (errorKeys.length > 0) {
                    errorKeys.forEach(key => {
                        newErrors[key] = data[key];
                        newStatus[key] = 'error';
                    });
                } 
                else if (data.message) {
                    newErrors['password'] = data.message;
                    newStatus['password'] = 'error';
                }

                setErrorMsg(newErrors);
                setStatus(newStatus);
                return;
            }

            localStorage.setItem("Authorization", data.token);
            localStorage.setItem("email", email);

            window.location.href = '/';
        } catch (err: any) {
            console.log(err);
            setStatus(prev => ({ ...prev, password: "error" }));
            setErrorMsg(prev => ({ ...prev, password: err }));
        }
    }

    return (
        <>
            <div className="page-wrapper">
                <Brand />
                <div className="center">
                    <RegisterForm 
                        handleInstanceSelect={handleInstanceSelect}
                        handleSignup={handleSignup}
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
                    <div className={`preview-tab ${showPreview ? 'active' : ''}`} onClick={() => setShowPreview(!showPreview)}>{showPreview ? "Close Preview" : "Preview Account"}</div>
                    {showPreview && <></>}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Register;