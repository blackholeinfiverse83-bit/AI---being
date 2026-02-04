import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [command, setCommand] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 140)}px`;
    }
  }, [command]);

  const handleExecute = () => {
    if (command.trim() && !isLoading) {
      onSendMessage(command.trim());
      setCommand('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '56px';
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  return (

    <div className="w-full backdrop-blur-xl bg-white/80 dark:bg-iosGray-900/80 border-t border-iosGray-200/50 dark:border-iosGray-800/50 px-4 py-4 z-10">
      <div className="w-full">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full pl-5 pr-28 py-4 backdrop-blur-md bg-iosGray-100/80 dark:bg-iosGray-800/80 border border-iosGray-200/50 dark:border-iosGray-700/50 text-iosGray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-iosBlue-500/50 focus:border-iosBlue-500/50 resize-none min-h-[56px] max-h-36 overflow-y-auto text-sm placeholder-iosGray-500 font-sf shadow-ios transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleExecute}
                disabled={!command.trim() || isLoading}
                className="absolute right-3 bottom-3 px-5 py-2.5 bg-iosBlue-500 text-white rounded-xl hover:bg-iosBlue-600 active:scale-95 disabled:bg-iosGray-300 dark:disabled:bg-iosGray-700 disabled:text-iosGray-500 dark:disabled:text-iosGray-500 disabled:cursor-not-allowed transition-all text-sm font-semibold flex items-center gap-2 shadow-ios font-sf"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-iosGray-500 dark:text-iosGray-500 font-sf">
              Press <kbd className="px-1.5 py-0.5 backdrop-blur-sm bg-iosGray-200/50 dark:bg-iosGray-800/50 border border-iosGray-300/30 dark:border-iosGray-700/30 rounded text-iosGray-600 dark:text-iosGray-400">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 backdrop-blur-sm bg-iosGray-200/50 dark:bg-iosGray-800/50 border border-iosGray-300/30 dark:border-iosGray-700/30 rounded text-iosGray-600 dark:text-iosGray-400">Shift+Enter</kbd> for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
