import { ClearSelectedInstanceModal } from '../components/modals/clearSelectedInstance';
import { ConfirmationDeleteModal } from '../components/modals/confirmationDelete';
import { ConfirmationLeaveModal } from '../components/modals/confirmationLeave';
import { CreateServerModal } from '../components/modals/createServer';
import { JoinOrCreateServerModal } from '../components/modals/joinOrCreateServer';
import { JoinServerModal } from '../components/modals/joinServer';
import { ServerProfileModal } from '../components/modals/serverProfile';
import { useModal } from './modal';

export const ModalRoot = () => {
  const { modalType, modalData, closeModal } = useModal();

  if (!modalType) return null;

  const isProfile = modalType === 'SERVER_PROFILE' || modalType === 'USER_PROFILE';

  return (
    <div className='modal-backdrop' onClick={closeModal}>
      <div
        className={`modal-container ${isProfile ? 'modal-container-profile' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {modalType === 'WHATS_IT_GONNA_BE' && <JoinOrCreateServerModal />}
        {modalType === 'CREATE_SERVER' && <CreateServerModal />}
        {modalType === 'JOIN_SERVER' && <JoinServerModal />}
        {modalType === 'CLEAR_SELECTED_INSTANCE' && <ClearSelectedInstanceModal />}
        {modalType === 'CONFIRMATION_LEAVE' && <ConfirmationLeaveModal {...modalData} />}
        {modalType === 'CONFIRMATION_DELETE' && <ConfirmationDeleteModal {...modalData} />}
        {modalType === 'SERVER_PROFILE' && <ServerProfileModal {...modalData} />}
      </div>
    </div>
  );
};
