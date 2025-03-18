
import { retryWithBackoff } from "./retryUtils";
import { aiRequestManager } from "./aiRequestManager";
import { TimerSession } from "@/types/timer";
import { geminiService } from "@/services/geminiService";

interface SuggestionContext {
  taskContext: string;
  previousSessions?: TimerSession[];
  userFeedback?: number[];
}

export const getTimerSuggestion = async (context: SuggestionContext): Promise<number> => {
  try {
    return await geminiService.suggestTimer(buildSuggestionPrompt(context));
  } catch (error) {
    console.error('Error getting timer suggestion:', error);
    return 25; // Default fallback
  }
};

// For backward compatibility with existing code
export const generateTimerSuggestion = async (data: any): Promise<any[]> => {
  console.log("Generating timer suggestions based on data:", data);
  
  // Generate some dummy suggestions
  return [
    { duration: 25, reason: "Standard pomodoro session", mode: "focus" },
    { duration: 5, reason: "Quick break", mode: "break" },
    { duration: 50, reason: "Deep work session", mode: "focus" },
    { duration: 15, reason: "Recovery break", mode: "break" }
  ];
};

const buildSuggestionPrompt = (context: SuggestionContext): string => {
  let prompt = `Suggest an optimal timer duration in minutes for this task: ${context.taskContext}\n`;
  
  if (context.previousSessions?.length) {
    prompt += '\nPrevious session durations:';
    context.previousSessions.forEach(session => {
      prompt += `\n- ${session.duration} minutes (Productivity: ${session.productivityScore || 'N/A'})`;
    });
  }

  if (context.userFeedback?.length) {
    const avgFeedback = context.userFeedback.reduce((a, b) => a + b, 0) / context.userFeedback.length;
    prompt += `\nAverage user satisfaction: ${avgFeedback.toFixed(1)}/5`;
  }

  return prompt;
};

const validateSuggestion = (suggestion: string): number => {
  const minutes = parseInt(suggestion);
  if (isNaN(minutes) || minutes < 1 || minutes > 120) {
    throw new Error('Invalid duration suggestion');
  }
  return minutes;
};
