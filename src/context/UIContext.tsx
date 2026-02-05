import React, { createContext, useContext, useState, ReactNode } from 'react';

type UIContextType = {
    activeAgentView: 'none' | 'chat' | 'agent';
    setActiveAgentView: (view: 'none' | 'chat' | 'agent') => void;
    openAgent: () => void;
    openSupportBot: () => void;
    closeAll: () => void;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [activeAgentView, setActiveAgentView] = useState<'none' | 'chat' | 'agent'>('none');

    const openAgent = () => setActiveAgentView('agent');
    const openSupportBot = () => setActiveAgentView('chat');
    const closeAll = () => setActiveAgentView('none');

    return (
        <UIContext.Provider value={{ activeAgentView, setActiveAgentView, openAgent, openSupportBot, closeAll }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
