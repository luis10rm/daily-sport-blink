import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmitFeedback } from "@/hooks/useFeedback";
import { cn } from "@/lib/utils";

interface FeedbackBoxProps {
  className?: string;
}

export const FeedbackBox = ({ className }: FeedbackBoxProps) => {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: submitFeedback, isPending } = useSubmitFeedback();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim().length < 5) return;
    
    submitFeedback(message.trim(), {
      onSuccess: () => {
        setSubmitted(true);
        setMessage("");
        setTimeout(() => setSubmitted(false), 5000);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (submitted) {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3",
        className
      )}>
        <Check className="h-5 w-5 text-green-500 shrink-0" />
        <span className="text-sm text-muted-foreground">
          Dziękujemy za opinię!
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3",
      className
    )}>
      <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Czego Ci brakuje? Daj znać w kilku słowach..."
        className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none min-h-[24px]"
        rows={1}
        disabled={isPending}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSubmit}
        disabled={message.trim().length < 5 || isPending}
        className="shrink-0 h-8 px-3"
      >
        <Send className="h-4 w-4" />
        <span className="ml-1.5 hidden sm:inline">Wyślij</span>
      </Button>
    </div>
  );
};
