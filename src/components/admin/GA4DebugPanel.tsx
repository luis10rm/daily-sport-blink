import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export const GA4DebugPanel = () => {
  const [gtagAvailable, setGtagAvailable] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const available = typeof window.gtag === 'function';
    setGtagAvailable(available);

    if (available) {
      // Patch gtag to count events
      const original = window.gtag;
      let count = 0;
      window.gtag = (...args: unknown[]) => {
        if (args[0] === 'event' && args[1] === 'page_view') {
          count++;
          setEventCount(count);
        }
        original(...args);
      };
      return () => { window.gtag = original; };
    }
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          GA4 Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Badge variant={gtagAvailable ? "default" : "destructive"}>
          {gtagAvailable ? "gtag ✓" : "gtag ✗"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {eventCount} page_view w tej sesji
        </span>
      </CardContent>
    </Card>
  );
};
