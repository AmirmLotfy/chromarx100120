
export interface TimerSuggestionProps {
  onSelectDuration?: (mins: number) => void;
  taskContext?: string;
  mode: "focus" | "break";
}
