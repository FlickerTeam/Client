import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ModalRoot } from './modalroot';

import './modal.css';

type ModalType = 'JOIN_SERVER' |'CREATE_SERVER' | 'USER_PROFILE' | 'USER_PROFILE_SHORT' | 'WHATS_IT_GONNA_BE' | null;

interface ModalContextType {
    modalType: ModalType;
    modalData: any;
    openModal: (type: ModalType, data?: any) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ( { children } : { children: ReactNode}) => {
    const [modalType, setModalType] = useState<ModalType>(null);
    const [modalData, setModalData] = useState<any>(null);

    const openModal = (type: ModalType, data: any = null) => {
        setModalType(type);
        setModalData(data);
    };

    const closeModal = () => {
        setModalType(null);
        setModalData(null);
    };

    return (
        <ModalContext.Provider value={{ modalType, modalData, openModal, closeModal }}>
            {children}
            {modalType && <ModalRoot />}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);

    if (!context) {
        throw new Error("useModal must be used within ModalProvider");
    }

    return context;
};