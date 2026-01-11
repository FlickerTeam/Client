import { JSX } from "react";
import { useModal } from '../../context/modal';

export const JoinOrCreateServerModal = () : JSX.Element => {
    const { openModal } = useModal();
    
    return (
        <div className="join-server-modal">
            <h2>Let's get the party started!</h2>
            <p>Do you want to join or create a new server?</p>
            <div className="modal-footer" style={{
                gap: '15px'
            }}>
                <button onClick={() => openModal('CREATE_SERVER')}>Create a new server</button>
                <button onClick={() => openModal('JOIN_SERVER')} className="join-btn">Join a Server</button>
            </div>
        </div>
    )
};