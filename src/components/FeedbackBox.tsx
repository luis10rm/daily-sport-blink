import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmitFeedback } from "@/hooks/useFeedback";
import { cn } from "@/lib/utils";

interface FeedbackBoxProps {
  className?: string;
}

/**
 * Plain footer form: label + single-line input + "Wyślij".
 * Submission goes through the same useSubmitFeedback mutation as before.
 */
export const FeedbackBox = ({ className }: FeedbackBoxProps) => {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { mutate: submitFeedback, isPending } = useSubmitFeedback();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) return;

    submitFeedback(message.trim(), {
      onSuccess: () => {
        setSubmitted(true);
        setMessage("");
        setTimeout(() => setSubmitted(false), 5000);
      },
    });
  };

  if (submitted) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span>Dziękujemy za opinię!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full space-y-2", className)}>
      <label
        htmlFor="footer-feedback"
        className="block text-sm font-medium text-foreground"
      >
        Czego Ci brakuje na Szortsach?
      </label>
      <div className="flex items-center gap-2">
        <input
          id="footer-feedback"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Napisz w kilku słowach..."
          maxLength={500}
          disabled={isPending}
          className="h-11 w-full min-w-0 rounded-control border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button
          type="submit"
          size="sm"
          disabled={message.trim().length < 5 || isPending}
          className="h-11 shrink-0 rounded-control px-4"
        >
          <Send className="h-4 w-4" aria-hidden />
          <span className="ml-1.5">Wyślij</span>
        </Button>
      </div>
    </form>
  );
};
