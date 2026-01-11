import { JSX, useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Footer from '../components/common/footer';
import Brand from "../components/common/brand";
import LoginForm from "../components/auth/loginform";
import { Instance } from "../interfaces/instance";
import { ErrorStatusFields } from "../interfaces/errorstatusfields";
import { SpacebarResponse } from "../interfaces/spacebarresponse";
import { LoginRequest } from "../interfaces/loginrequest";

function Login(): JSX.Element {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [instance, setInstance] = useState<Instance | null | string>("");
    const [customInstance, setCustomInstance] = useState("");
    const [instances, setInstances] = useState<Instance[] | []>([]);
    const [errorMsg, setErrorMsg] = useState({});
    const [status, setStatus] = useState<ErrorStatusFields>({
        instance: null,
        email: null,
        password: null
    });

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
    
    const handleInstanceSelect = (e: any) => {
        const selected = e.target.value;

        setInstance(selected);

        if (selected !== 'custom-instance') {
            checkInstance(selected);
        } else {
            setStatus(prev => ({ ...prev, instance: null }));
        }
    };

    let Authorization = localStorage.getItem('Authorization');

    if (Authorization) {
        return <Navigate to="/" />;
    }

    const handleSignin = async () => {
        try {
            const loginRequest: LoginRequest = {
                password: password
            }

            let apiVersion = localStorage.getItem("defaultApiVersion"); //6

            if (apiVersion && parseInt(apiVersion) > 6) {
                loginRequest.login = email;
            } else {
                loginRequest.email = email;
            }

            const response = await fetch(`${localStorage.getItem('selectedInstanceUrl')}/${localStorage.getItem('defaultApiVersion')}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginRequest)
            });

            const data = await response.json();

            if (!response.ok) {
                return;
            }

            if (!data.token) {
                return;
            }

            localStorage.setItem("Authorization", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            window.location.href = '/';
        } catch (err) {
            console.log(err);
        }
    }

    return (
    <>
        <div className="page-wrapper">
                <Brand/>
                <div className="center">
                    <LoginForm
                        handleInstanceSelect={handleInstanceSelect}
                        handleSignin={handleSignin}
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
                <Footer/>
            </div>
        </>
    );
}

export default Login;