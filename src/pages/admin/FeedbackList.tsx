import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Check, Trash2, Mail, MailOpen } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useFeedbackList, useMarkFeedbackRead, useDeleteFeedback } from "@/hooks/useFeedback";
import { cn } from "@/lib/utils";

const FeedbackList = () => {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data: feedbackList = [], isLoading } = useFeedbackList();
  const { mutate: markRead } = useMarkFeedbackRead();
  const { mutate: deleteFeedback } = useDeleteFeedback();

  const filteredFeedback = filter === "unread"
    ? feedbackList.filter(f => !f.is_read)
    : feedbackList;

  const unreadCount = feedbackList.filter(f => !f.is_read).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Feedback</h1>
            <p className="text-sm text-muted-foreground">
              Opinie użytkowników o serwisie
            </p>
          </div>
          
          {/* Filter tabs */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Wszystkie ({feedbackList.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Nieprzeczytane ({unreadCount})
            </Button>
          </div>
        </div>

        {/* Feedback list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {filter === "unread" 
              ? "Brak nieprzeczytanych wiadomości"
              : "Brak feedbacku"
            }
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((feedback) => (
              <div
                key={feedback.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  feedback.is_read 
                    ? "bg-card border-border" 
                    : "bg-primary/5 border-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Status and date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {feedback.is_read ? (
                        <MailOpen className="h-3.5 w-3.5" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span>
                        {format(new Date(feedback.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                      </span>
                      {!feedback.is_read && (
                        <Badge variant="secondary" className="text-xs">
                          Nowy
                        </Badge>
                      )}
                    </div>
                    
                    {/* Message */}
                    <p className="text-sm whitespace-pre-wrap">
                      {feedback.message}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markRead({ id: feedback.id, is_read: !feedback.is_read })}
                      title={feedback.is_read ? "Oznacz jako nieprzeczytane" : "Oznacz jako przeczytane"}
                    >
                      <Check className={cn("h-4 w-4", feedback.is_read && "text-green-500")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFeedback(feedback.id)}
                      title="Usuń"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FeedbackList;
