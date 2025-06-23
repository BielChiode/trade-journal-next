import React from 'react';
import { Button } from './Button';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirmar", 
    cancelText = "Cancelar", 
    loading = false 
}) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col items-center text-center p-4">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                <p className="mb-6 text-gray-600 text-base">{message}</p>
                <div className="flex w-full flex-col sm:flex-row gap-3">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        className="flex-1 order-2 sm:order-1"
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={onConfirm} 
                        className="flex-1 order-1 sm:order-2"
                        disabled={loading}
                    >
                        {loading ? 'Excluindo...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal; 