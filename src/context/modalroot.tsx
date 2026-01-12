import { CreateServerModal } from "../components/modals/createserver";
import { JoinOrCreateServerModal } from "../components/modals/joinorcreateserver";
import { JoinServerModal } from "../components/modals/joinserver";
import { useModal } from "./modal";

export const ModalRoot = () => {
    const { modalType, closeModal } = useModal();

    if (!modalType) return null;

   return (
        <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {modalType === 'WHATS_IT_GONNA_BE' && <JoinOrCreateServerModal />}
                {modalType === 'CREATE_SERVER' && <CreateServerModal />}
                {modalType === 'JOIN_SERVER' && <JoinServerModal />}
            </div>
        </div>
    );
};