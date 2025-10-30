import React, { useState, useEffect, useCallback } from 'react';
import { BusinessData } from '../types';
import { fetchBusinessData } from '../services/sheetService';
import { updateSystemInstruction } from '../services/geminiService';
import { XIcon, SheetIcon, AlertTriangleIcon, RefreshCwIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateSuccess: () => void;
}

type ViewState = 'idle' | 'loading' | 'error' | 'success';

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onUpdateSuccess }) => {
    const [showContent, setShowContent] = useState(false);
    const [viewState, setViewState] = useState<ViewState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<BusinessData | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setViewState('idle');
            setError(null);
            setData(null);
            const timer = setTimeout(() => setShowContent(true), 10);
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
        }
    }, [isOpen]);

    const handleFetchData = useCallback(async () => {
        setViewState('loading');
        setError(null);
        try {
            const fetchedData = await fetchBusinessData();
            setData(fetchedData);
            setViewState('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setViewState('error');
        }
    }, []);

    const handleUpdateAI = () => {
        if (data) {
            updateSystemInstruction(data);
            onUpdateSuccess();
        }
    };

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const renderContent = () => {
        switch (viewState) {
            case 'loading':
                return <div className="flex flex-col items-center justify-center p-8"><LoadingSpinner /><p className="mt-4 text-gray-300">Fetching data from sheet...</p></div>;
            case 'error':
                return <div className="p-8 text-center">
                    <AlertTriangleIcon className="h-10 w-10 text-red-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-red-300">Failed to Fetch Data</h3>
                    <p className="text-sm text-red-300 mt-2 mb-6">{error}</p>
                    <button onClick={handleFetchData} className="inline-flex items-center px-4 py-2 bg-brand-light text-brand-dark text-sm font-medium rounded-md hover:bg-brand-light/80">
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        Retry
                    </button>
                </div>;
            case 'success':
                return data ? (
                    <>
                        <div className="p-6 overflow-y-auto max-h-[60vh] text-gray-200">
                            <h3 className="text-lg font-semibold text-white mb-4">Data Preview</h3>
                            <div className="space-y-4 text-sm">
                                <div><strong className="font-medium text-gray-100">Concept:</strong> <p className="text-gray-300 pl-2">{data.concept}</p></div>
                                <div><strong className="font-medium text-gray-100">Signature Drinks:</strong>
                                    <ul className="list-disc pl-8 text-gray-300">
                                        {data.signatureDrinks.map(d => <li key={d.name}><strong>{d.name}:</strong> {d.description}</li>)}
                                    </ul>
                                </div>
                                <div><strong className="font-medium text-gray-100">Opening Hours:</strong>
                                     <ul className="list-disc pl-8 text-gray-300">
                                        {data.openingHours.map(h => <li key={h.days}><strong>{h.days}:</strong> {h.time}</li>)}
                                    </ul>
                                </div>
                                {/* Add more data fields as needed */}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-black/30 border-t border-white/20">
                            <button onClick={handleUpdateAI} className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors">
                                Update AI Assistant with this Data
                            </button>
                        </div>
                    </>
                ) : null;
            case 'idle':
            default:
                return (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-white">
                        <SheetIcon className="h-12 w-12 text-brand-light/80 mb-4" />
                        <h3 className="text-lg font-semibold">Sync with Google Sheets</h3>
                        <p className="mt-2 text-sm text-gray-300 max-w-xs">
                            Fetch the latest business info from your configured spreadsheet to update the AI assistant's knowledge.
                        </p>
                        <button onClick={handleFetchData} className="mt-6 w-full py-2.5 px-4 bg-brand-light text-brand-dark font-semibold rounded-md hover:bg-brand-light/80 transition-colors">
                            Sync Now
                        </button>
                    </div>
                );
        }
    };

    return (
        <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleOverlayClick}
            aria-modal="true"
            role="dialog"
        >
            <div className={`relative bg-gray-900/50 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl w-full max-w-2xl m-4 transform transition-all duration-300 flex flex-col ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <header className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                    <button onClick={onClose} className="text-gray-300 hover:text-white" aria-label="Close modal">
                        <XIcon className="h-6 w-6" />
                    </button>
                </header>
                <div className="flex-grow min-h-0">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
