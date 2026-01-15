import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    headerClassName?: string;
    containerClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, headerClassName, containerClassName }) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const defaultContainerClass = "bg-background text-foreground rounded-lg shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto";
    const finalContainerClass = containerClassName || defaultContainerClass;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4" onClick={handleOverlayClick}>
            <div className={finalContainerClass}>
                <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${headerClassName ?? ''}`}>
                    <h2 className="text-base sm:text-lg font-semibold truncate pr-2">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-secondary rounded-full flex-shrink-0"
                        aria-label="Fechar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-3 sm:p-4 md:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal; 