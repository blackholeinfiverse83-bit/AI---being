import React, { useState, useEffect, useRef } from 'react';
import { AssistantResponse, ConversationMessage, Conversation } from './types';
import ChatSidebar from './components/ChatSidebar';
import { apiService } from './services/api';
import MessageInput from './components/MessageInput';
import ChatMessage from './components/ChatMessage';
import Toast from './components/Toast';
import ConnectionStatus from './components/ConnectionStatus';
import SearchPanel from './components/SearchPanel';
import ResearchPanel from './components/ResearchPanel';
import SystemInfoPanel from './components/SystemInfoPanel';
import PerformancePanel from './components/PerformancePanel';

type TabType = 'chat' | 'search' | 'research' | 'system' | 'performance';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('chatHistory');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [executions, setExecutions] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const executionsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    executionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [executions]);

  // Save conversations to local storage
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(conversations));
  }, [conversations]);

  // Sync current executions with active conversation
  useEffect(() => {
    if (!currentConversationId) return;

    setConversations(prev => prev.map(c => {
      if (c.id === currentConversationId) {
        // Only update if messages referentially different or length changed to avoid loops?
        // But executions is source of truth for active chat.
        return {
          ...c,
          messages: executions,
          title: c.title === 'New Chat' && executions.length > 0
            ? executions[0].userMessage.slice(0, 30) + (executions[0].userMessage.length > 30 ? '...' : '')
            : c.title,
          timestamp: new Date().toISOString()
        };
      }
      return c;
    }));
  }, [executions, currentConversationId]);

  const handleNewChat = () => {
    setExecutions([]);
    setCurrentConversationId(null);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSelectChat = (id: string) => {
    const convo = conversations.find(c => c.id === id);
    if (convo) {
      setExecutions(convo.messages);
      setCurrentConversationId(id);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      handleNewChat();
    }
  };

  // Detect if the message is a task creation intent
  // const isTaskIntent = (message: string): boolean => {
  //   const taskKeywords = ['task', 'create', 'remind', 'todo', 'add to list', 'schedule', 'set reminder'];
  //   const lowerMessage = message.toLowerCase();
  //   return taskKeywords.some(keyword => lowerMessage.includes(keyword));
  // };

  const handleExecuteCommand = async (userCommand: string) => {
    // Initialize conversation if needed
    let activeId = currentConversationId;
    if (!activeId) {
      activeId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: activeId,
        title: 'New Chat',
        messages: [],
        timestamp: new Date().toISOString()
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(activeId);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Add execution immediately
    const newExecution: ConversationMessage = {
      id: executionId,
      userMessage: userCommand,
      assistantResponse: null,
      timestamp,
      isLoading: true,
    };

    setExecutions((prev) => [...prev, newExecution]);
    setIsLoading(true);

    // Show confirmation toast
    setToast({ message: 'Message sent', type: 'success' });

    try {
      let response: AssistantResponse;

      // Route to appropriate endpoint based on intent
      // Always route to valid assistant endpoint
      response = await apiService.sendMessage({
        message: userCommand,
        platform: 'web',
        device_context: 'desktop',
      });

      // Update execution with response
      setExecutions((prev) =>
        prev.map((exec) =>
          exec.id === executionId
            ? {
              ...exec,
              assistantResponse: response,
              isLoading: false,
              error: response.status === 'error' ? response.error : undefined,
            }
            : exec
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      // Create error response
      const errorResponse: AssistantResponse = {
        status: 'error',
        data: {},
        error: errorMessage,
      };

      setExecutions((prev) =>
        prev.map((exec) =>
          exec.id === executionId
            ? {
              ...exec,
              assistantResponse: errorResponse,
              isLoading: false,
              error: errorMessage,
            }
            : exec
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'chat' as TabType, label: 'Chat', icon: '💬' },
    // { id: 'search' as TabType, label: 'Search', icon: '🔍' },
    // { id: 'research' as TabType, label: 'Research', icon: '📚' },
    // { id: 'system' as TabType, label: 'System', icon: '⚙️' },
    // { id: 'performance' as TabType, label: 'Performance', icon: '📊' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-b from-iosGray-100 to-white dark:from-black dark:to-iosGray-900">
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={currentConversationId}
        onSelect={handleSelectChat}
        onNewChat={handleNewChat}
        onDelete={handleDeleteChat}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-[280px]' : ''}`}>
        {/* Connection Status */}
        <ConnectionStatus />

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* iOS-style Header with Blur */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-iosGray-900/70 border-b border-iosGray-200/50 dark:border-iosGray-800/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-iosGray-900 dark:text-white flex items-center gap-3 font-sf">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-1 -ml-2 mr-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-6 h-6 text-iosGray-600 dark:text-iosGray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <span className="inline-block w-2.5 h-2.5 bg-iosBlue-500 rounded-full animate-pulse"></span>
                  AI Assistant
                </h1>
                <p className="text-sm text-iosGray-600 dark:text-iosGray-400 mt-1 font-sf">
                  Your unified AI assistant with advanced capabilities
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-iosGray-500 dark:text-iosGray-500 font-sf">Status</div>
                <div className="text-sm font-medium text-iosBlue-500 font-sf">Online</div>
              </div>
            </div>
          </div>

        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6">
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <>
                {executions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-block p-8 backdrop-blur-xl bg-white/60 dark:bg-iosGray-800/60 rounded-3xl mb-6 shadow-ios-lg border border-white/20 dark:border-iosGray-700/30">
                      <svg
                        className="w-20 h-20 text-iosBlue-500 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-semibold text-iosGray-900 dark:text-white mb-3 font-sf">
                      Start a conversation
                    </h2>
                    <p className="text-iosGray-600 dark:text-iosGray-400 mb-8 max-w-md mx-auto font-sf">
                      I'm your unified AI assistant with multi-agent capabilities, safety enforcement, and intelligent routing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-32">
                    {executions.map((execution) => (
                      <ChatMessage
                        key={execution.id}
                        userMessage={execution.userMessage}
                        assistantResponse={execution.assistantResponse}
                        timestamp={execution.timestamp}
                        isLoading={execution.isLoading}
                        error={execution.error}
                      />
                    ))}
                    <div ref={executionsEndRef} />
                  </div>
                )}
              </>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && <SearchPanel />}

            {/* Research Tab */}
            {activeTab === 'research' && <ResearchPanel />}

            {/* System Tab */}
            {activeTab === 'system' && <SystemInfoPanel />}

            {/* Performance Tab */}
            {activeTab === 'performance' && <PerformancePanel />}
          </div>
        </main>

        {/* Message Input - Only show on Chat tab */}
        {activeTab === 'chat' && (
          <MessageInput onSendMessage={handleExecuteCommand} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

export default App;
