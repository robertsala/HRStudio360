import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, Circle, BookOpen, Clock, Award, PlayCircle } from 'lucide-react';
import { Tutorial, TutorialStep, TutorialCompletion } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../../lib/queryClient';

interface TutorialWithSteps extends Tutorial {
  steps: TutorialStep[];
  progress: TutorialCompletion | null;
}

interface TutorialViewerProps {
  tutorialId: string;
  onClose: () => void;
  onAction?: (actionType: string, actionTarget: string) => void;
}

const TutorialViewer: React.FC<TutorialViewerProps> = ({ tutorialId, onClose, onAction }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Fetch tutorial with steps and progress
  const { data: tutorial, isLoading } = useQuery<TutorialWithSteps>({
    queryKey: ['/api/tutorials', tutorialId],
    enabled: !!tutorialId
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { currentStepNumber: number; completedSteps: number[]; isCompleted?: boolean }) => {
      return apiRequest(`/api/tutorials/${tutorialId}/progress`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tutorials', tutorialId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tutorials'] });
    }
  });

  // Initialize from existing progress
  useEffect(() => {
    if (tutorial?.progress) {
      setCurrentStepIndex(Math.max(0, (tutorial.progress.currentStepNumber || 1) - 1));
      setCompletedSteps(tutorial.progress.completedSteps || []);
    }
  }, [tutorial]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const currentStep = tutorial?.steps[currentStepIndex];
  const totalSteps = tutorial?.steps.length || 0;
  const progressPercentage = totalSteps > 0 ? ((completedSteps.length / totalSteps) * 100) : 0;

  const handleMarkStepComplete = () => {
    if (!currentStep) return;

    const newCompletedSteps = [...completedSteps];
    if (!newCompletedSteps.includes(currentStep.stepNumber)) {
      newCompletedSteps.push(currentStep.stepNumber);
      setCompletedSteps(newCompletedSteps);

      // Update backend
      const isCompleted = newCompletedSteps.length === totalSteps;
      updateProgressMutation.mutate({
        currentStepNumber: currentStep.stepNumber,
        completedSteps: newCompletedSteps,
        isCompleted
      });
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextStepNumber = currentStepIndex + 2; // +1 for index, +1 for next
      setCurrentStepIndex(currentStepIndex + 1);
      updateProgressMutation.mutate({
        currentStepNumber: nextStepNumber,
        completedSteps
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevStepNumber = currentStepIndex; // 0-indexed to 1-indexed
      setCurrentStepIndex(currentStepIndex - 1);
      updateProgressMutation.mutate({
        currentStepNumber: prevStepNumber,
        completedSteps
      });
    }
  };

  const handleActionClick = () => {
    if (currentStep?.actionType && currentStep?.actionTarget && onAction) {
      onAction(currentStep.actionType, currentStep.actionTarget);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tutorial...</p>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Tutorial not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            data-testid="button-close"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{tutorial.title}</h2>
              <p className="text-blue-100 text-sm">{tutorial.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors ml-4"
              data-testid="button-close-tutorial"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tutorial metadata */}
          <div className="flex items-center gap-4 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{tutorial.estimatedMinutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{totalSteps} steps</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
              {tutorial.difficulty}
            </span>
            {tutorial.tags && tutorial.tags.length > 0 && (
              <div className="flex gap-2 ml-auto">
                {tutorial.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-white/20 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Progress</span>
              <span>{completedSteps.length} / {totalSteps} completed ({Math.round(progressPercentage)}%)</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep && (
            <div className="space-y-6">
              {/* Step header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Step {currentStep.stepNumber} of {totalSteps}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentStep.title}
                  </h3>
                </div>
                {completedSteps.includes(currentStep.stepNumber) && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
              </div>

              {/* Step content */}
              <div 
                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: currentStep.content }}
              />

              {/* Step image/video */}
              {currentStep.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={currentStep.imageUrl} 
                    alt={currentStep.title}
                    className="w-full"
                  />
                </div>
              )}

              {/* Checklist */}
              {currentStep.checklist && currentStep.checklist.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Checklist
                  </h4>
                  <ul className="space-y-2">
                    {currentStep.checklist.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                        <Circle className="h-4 w-4 mt-1 text-blue-600 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action button */}
              {currentStep.actionType && currentStep.actionTarget && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Practice what you learned</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentStep.actionLabel || 'Try this feature now'}
                      </p>
                    </div>
                    <button
                      onClick={handleActionClick}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg"
                      data-testid="button-try-now"
                    >
                      <PlayCircle className="h-5 w-5" />
                      Try it now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="button-prev-step"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              {!completedSteps.includes(currentStep?.stepNumber || 0) && (
                <button
                  onClick={handleMarkStepComplete}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  data-testid="button-mark-complete"
                >
                  <CheckCircle className="h-5 w-5" />
                  Mark as Complete
                </button>
              )}

              {currentStepIndex < totalSteps - 1 ? (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="button-next-step"
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors"
                  data-testid="button-finish"
                >
                  <Award className="h-5 w-5" />
                  Finish Tutorial
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialViewer;
