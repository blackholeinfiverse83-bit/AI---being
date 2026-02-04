import React from 'react';
import { Conversation } from '../types';

interface ChatSidebarProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNewChat: () => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    isOpen: boolean;
    onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations,
    activeId,
    onSelect,
    onNewChat,
    onDelete,
    isOpen,
    onClose,
}) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
        fixed top-0 bottom-0 left-0 z-[60]
        w-[280px] bg-iosGray-100/95 dark:bg-iosGray-900/95 backdrop-blur-xl
        border-r border-iosGray-200/50 dark:border-iosGray-800/50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
                {/* Header */}
                <div className="p-4 border-b border-iosGray-200/50 dark:border-iosGray-800/50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-iosGray-900 dark:text-white font-sf">History</h2>
                    <button title="Click to close sidebar" onClick={onClose} className="lg:hidden p-2 text-iosGray-500 hover:text-iosGray-900 dark:hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-4">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-iosBlue-500 hover:bg-iosBlue-600 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-ios active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                    </button>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 text-iosGray-400 dark:text-iosGray-600">
                            <p className="text-sm font-sf">No history yet</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`
                  group relative flex items-center p-3 rounded-xl cursor-pointer transition-colors
                  ${activeId === conv.id
                                        ? 'bg-white dark:bg-iosGray-800 shadow-sm'
                                        : 'hover:bg-white/50 dark:hover:bg-iosGray-800/50'
                                    }
                `}
                            >
                                <div className="flex-1 min-w-0 mr-2">
                                    <h3 className={`text-sm font-medium truncate font-sf ${activeId === conv.id ? 'text-iosBlue-600 dark:text-iosBlue-400' : 'text-iosGray-900 dark:text-gray-200'
                                        }`}>
                                        {conv.title || 'New Conversation'}
                                    </h3>
                                    <p className="text-xs text-iosGray-500 truncate font-sf">
                                        {new Date(conv.timestamp).toLocaleDateString()}
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => onDelete(conv.id, e)}
                                    title="Delete chat"
                                    className={`
                    p-1.5 rounded-full text-iosGray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all
                    opacity-0 group-hover:opacity-100
                    ${activeId === conv.id ? 'opacity-100' : ''}
                  `}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatSidebar;
