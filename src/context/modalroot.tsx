import { ClearSelectedInstanceModal } from "../components/modals/clearselectedinstance";
import { ConfirmationDeleteModal } from "../components/modals/confirmationdelete";
import { ConfirmationLeaveModal } from "../components/modals/confirmationleave";
import { CreateServerModal } from "../components/modals/createserver";
import { JoinOrCreateServerModal } from "../components/modals/joinorcreateserver";
import { JoinServerModal } from "../components/modals/joinserver";
import { useModal } from "./modal";

export const ModalRoot = () => {
    const { modalType, modalData, closeModal } = useModal();

    if (!modalType) return null;

   return (
        <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {modalType === 'WHATS_IT_GONNA_BE' && <JoinOrCreateServerModal />}
                {modalType === 'CREATE_SERVER' && <CreateServerModal />}
                {modalType === 'JOIN_SERVER' && <JoinServerModal />}
                {modalType === 'CLEAR_SELECTED_INSTANCE' && <ClearSelectedInstanceModal/>}
                {modalType === 'CONFIRMATION_LEAVE' && (
                    <ConfirmationLeaveModal {...modalData} />
                )}
                {modalType === 'CONFIRMATION_DELETE' && (
                    <ConfirmationDeleteModal {...modalData} />
                )}
            </div>
        </div>
    );
};