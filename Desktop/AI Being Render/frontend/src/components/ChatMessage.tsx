import React, { useState } from 'react';
import { AssistantResponse } from '../types';
import StatusIndicator from './StatusIndicator';
import ActionCard from './ActionCard';
import NextStepHint from './NextStepHint';
import LoadingSpinner from './LoadingSpinner';
import {
  translateIntent,
  translateTaskType,
  translateActionStatus,
  formatFriendlyTimestamp
} from '../utils/translations';

interface ChatMessageProps {
  userMessage: string;
  assistantResponse: AssistantResponse | null;
  timestamp: string;
  isLoading?: boolean;
  error?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  userMessage,
  assistantResponse,
  timestamp,
  isLoading,
  error,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  // User message bubble - iOS style
  const UserBubble = () => (
    <div className="flex justify-end mb-4">
      <div className="max-w-[75%] lg:max-w-[60%]">
        <div className="bg-iosBlue-500 text-white rounded-3xl rounded-tr-sm px-5 py-3 shadow-ios backdrop-blur-sm font-sf">
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-sf">{userMessage}</p>
        </div>
        <div className="text-xs text-iosGray-500 dark:text-iosGray-500 mt-1.5 text-right px-2 font-sf">
          {formatFriendlyTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );

  // Loading state - iOS style
  if (isLoading) {
    return (
      <>
        <UserBubble />
        <div className="flex justify-start mb-4">
          <div className="max-w-[75%] lg:max-w-[60%]">
            <div className="backdrop-blur-xl bg-white/70 dark:bg-iosGray-800/70 rounded-3xl rounded-tl-sm px-5 py-4 shadow-ios border border-white/20 dark:border-iosGray-700/30">
              <LoadingSpinner stage="execution" />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state - iOS style
  if (error || (assistantResponse && assistantResponse.status === 'error')) {
    return (
      <>
        <UserBubble />
        <div className="flex justify-start mb-4">
          <div className="max-w-[75%] lg:max-w-[60%]">
            <div className="backdrop-blur-xl bg-red-50/80 dark:bg-red-900/30 rounded-3xl rounded-tl-sm px-5 py-4 shadow-ios border border-red-200/50 dark:border-red-800/30">
              <div className="flex items-center gap-2 mb-3">
                <StatusIndicator status="failed" label="Couldn't complete that" />
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm font-sf mb-3">
                {error || assistantResponse?.error || 'I ran into an issue processing your request.'}
              </p>
              <NextStepHint
                message="Please try again, or let me know if you need help with something else."
                type="info"
              />
            </div>
            <div className="text-xs text-iosGray-500 dark:text-iosGray-500 mt-1.5 px-2 font-sf">
              {formatFriendlyTimestamp(timestamp)}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!assistantResponse) return <UserBubble />;

  const { data } = assistantResponse;
  const { enforcement, safety } = data;
  const intent = data.intent?.intent || 'unknown';
  const taskType = data.task?.task_type || null;
  const finalDecision = data.decision?.final_decision || 'unknown';
  const assistantResponseText = data.decision?.response || data.summary?.summary || 'No response generated';
  const taskCreated = data.decision?.task_created;
  const processedAt = data.processed_at || timestamp;
  const isBlocked = enforcement?.decision === 'block';

  // Determine status
  const getActionStatus = (): 'executed' | 'completed' | 'executing' | 'pending' | 'failed' | 'skipped' => {
    const execStatus = data.execution?.status;
    if (execStatus) {
      if (execStatus === 'completed') return 'completed';
      if (execStatus === 'executing') return 'executing';
      if (execStatus === 'failed') return 'failed';
      if (execStatus === 'skipped') return 'skipped';
    }
    if (enforcement?.decision === 'block') return 'skipped';
    if (finalDecision.includes('task_created')) return 'completed';
    if (finalDecision.includes('generated') || finalDecision.includes('response')) return 'completed';
    if (finalDecision === 'bhiv_core') return 'executing';
    return 'pending';
  };

  const status = getActionStatus();
  const statusForStyle = status as 'completed' | 'executing' | 'failed' | 'pending' | 'skipped';
  const executionError = data.execution?.error;

  // Safety messages
  const hasSafetyMessage = enforcement && (enforcement.decision === 'block' || enforcement.decision === 'rewrite');
  const hasSafetyWarning = safety && (safety.level === 'blocked' || safety.level === 'high_risk');
  const fallbackTaskSummary = taskCreated?.description
    ? `I created a task: ${taskCreated.description}`
    : 'I created a task for you.';
  const displayResponseText = (() => {
    if (isBlocked) return '';
    if (assistantResponseText === 'Task processed successfully' && taskCreated) return fallbackTaskSummary;
    if (assistantResponseText === 'No response generated' && taskCreated) return fallbackTaskSummary;
    return assistantResponseText;
  })();

  return (
    <>
      <UserBubble />

      {/* Assistant Response Bubble - iOS Liquid Glass */}
      <div className="flex justify-start mb-4">
        <div className="max-w-[75%] lg:max-w-[60%]">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-iosGray-800/70 rounded-3xl rounded-tl-sm px-5 py-4 shadow-ios-lg border border-white/20 dark:border-iosGray-700/30">
            {/* Safety Messages (if needed) */}
            {hasSafetyMessage && (
              <div className={`mb-3 rounded-2xl px-4 py-2.5 backdrop-blur-md ${enforcement.decision === 'block'
                ? 'bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/30'
                : 'bg-yellow-50/80 dark:bg-yellow-900/30 border border-yellow-200/50 dark:border-yellow-800/30'
                }`}>
                <p className={`text-sm font-sf ${enforcement.decision === 'block' ? 'text-red-600 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                  {enforcement.decision === 'block'
                    ? "I can't help with that request. Let me know if there's something else I can do."
                    : "I rephrased this to keep things safe and clear."}
                </p>
              </div>
            )}

            {hasSafetyWarning && (
              <div className={`mb-3 rounded-2xl px-4 py-2.5 backdrop-blur-md ${safety.level === 'blocked'
                ? 'bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/30'
                : 'bg-orange-50/80 dark:bg-orange-900/30 border border-orange-200/50 dark:border-orange-800/30'
                }`}>
                <p className={`text-sm font-sf ${safety.level === 'blocked' ? 'text-red-600 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'
                  }`}>
                  {safety.level === 'blocked'
                    ? "I can't provide that content."
                    : "I'm being careful with this response."}
                </p>
              </div>
            )}

            {/* Intent Understanding (subtle) */}
            {intent !== 'unknown' && !isBlocked && (
              <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-xl bg-iosBlue-50/50 dark:bg-iosBlue-900/20 border border-iosBlue-100/50 dark:border-iosBlue-800/30">
                <svg className="w-4 h-4 text-iosBlue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-iosBlue-700 dark:text-iosBlue-300 font-sf">
                  <span className="font-medium">Got it:</span> {translateIntent(intent)}
                  {taskType && <span className="text-iosBlue-600 dark:text-iosBlue-400"> • {translateTaskType(taskType)}</span>}
                </div>
              </div>
            )}

            {/* Main Response */}
            {displayResponseText && (
              <div className="mb-3">
                <p className="text-iosGray-900 dark:text-white text-[15px] leading-relaxed whitespace-pre-wrap font-sf">
                  {displayResponseText}
                </p>
              </div>
            )}

            {/* Task Created - Action Card */}
            {taskCreated && (
              <div className="mt-4 pt-4 border-t border-iosGray-200/50 dark:border-iosGray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-400 font-semibold font-sf">Task Created</div>
                </div>
                <ActionCard task={taskCreated} showNextStep={true} />
                <NextStepHint
                  message="What would you like to do next? You can ask me to create more tasks, answer questions, or help with anything else."
                  type="suggestion"
                />
              </div>
            )}

            {/* Action Summary for completed responses (no task) */}
            {!taskCreated && status === 'completed' && (
              <div className="mt-4 pt-3 border-t border-iosGray-200/50 dark:border-iosGray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-400 font-semibold font-sf">
                    {finalDecision.includes('summary') ? 'Response ready' : 'All set'}
                  </div>
                </div>
              </div>
            )}

            {/* Next Step Hint for general responses */}
            {!taskCreated && displayResponseText && displayResponseText.length > 50 && (
              <NextStepHint
                message="Is there anything else I can help you with?"
                type="info"
              />
            )}

            {/* Status (only if not completed or has error) */}
            {(statusForStyle !== 'completed' || executionError) && (
              <div className="mt-3 pt-3 border-t border-iosGray-200/50 dark:border-iosGray-700/50">
                <StatusIndicator status={status} label={translateActionStatus(status, finalDecision)} />
                {statusForStyle === 'skipped' && enforcement?.decision === 'block' && (
                  <div className="mt-2 text-xs text-orange-700 dark:text-orange-400/90 italic font-sf">
                    Let me know if there's something else I can do for you.
                  </div>
                )}
                {executionError && (
                  <div className="mt-2 text-xs text-red-700 dark:text-red-400 font-sf">
                    What happened: {executionError}
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Details Toggle - for governance/technical info */}
            <div className="mt-3 pt-3 border-t border-iosGray-200/50 dark:border-iosGray-700/50">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-xs text-iosGray-500 hover:text-iosGray-700 dark:hover:text-iosGray-300 transition-colors font-sf"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {showDetails ? 'Hide details' : 'Show details'}
              </button>

              {showDetails && (
                <div className="mt-3 p-3 bg-iosGray-50 dark:bg-iosGray-900/50 rounded-xl text-xs font-sf space-y-2">
                  {intent !== 'unknown' && (
                    <div className="flex justify-between">
                      <span className="text-iosGray-500">Intent:</span>
                      <span className="text-iosGray-700 dark:text-iosGray-300">{translateIntent(intent)}</span>
                    </div>
                  )}
                  {enforcement && (
                    <div className="flex justify-between">
                      <span className="text-iosGray-500">Safety check:</span>
                      <span className="text-iosGray-700 dark:text-iosGray-300">{enforcement.decision === 'allow' ? 'Passed' : enforcement.decision}</span>
                    </div>
                  )}
                  {safety && safety.score && (
                    <div className="flex justify-between">
                      <span className="text-iosGray-500">Safety score:</span>
                      <span className="text-iosGray-700 dark:text-iosGray-300">{(safety.score * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-iosGray-500">Status:</span>
                    <span className="text-iosGray-700 dark:text-iosGray-300">{translateActionStatus(status, finalDecision)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-iosGray-500 dark:text-iosGray-500 mt-1.5 px-2 font-sf">
            {formatFriendlyTimestamp(processedAt)}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatMessage;
