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
    
    const handleInstanceSelect = async (e: any) => {
        let instance_url = e.target.value;

        setInstance(instance_url);
        setStatus(prev => ({ ...prev, instance: 'checking' }));

        try {
            const response = await fetch(`https://${instance_url}/.well-known/spacebar`);

            if (!response.ok) {
                setStatus(prev => ({ ...prev, instance: 'error' }));
                setErrorMsg(prev => ({ ...prev, instance: 'API returned an error' }));
                return;
            }

            let metadata: SpacebarResponse = await response.json();

            if (!metadata || !metadata.api) {
                setStatus(prev => ({ ...prev, instance: 'error' }));
                setErrorMsg(prev => ({ ...prev, instance: 'API returned an error' }));
                return;
            }

            localStorage.setItem("selectedInstanceUrl", metadata.api);

            setStatus(prev => ({ ...prev, instance: 'valid' }));
        }
        catch (error) {
            console.error("Could not resolve instance metadata:", error);

            setStatus(prev => ({ ...prev, instance: 'error' }));
            setErrorMsg(prev => ({ ...prev, instance: 'Request timed out' }));
        }
    };

    let Authorization = localStorage.getItem('Authorization');

    if (Authorization) {
        return <Navigate to="/" />;
    }

    const handleSignin = async () => {
        try {
            const loginRequest: LoginRequest = {
                email: email,
                password: password
            }

            const response = await fetch(`${localStorage.getItem('selectedInstanceUrl')}/auth/login`, {
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