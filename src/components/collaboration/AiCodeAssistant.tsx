import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Bug, Zap, Code2, Languages, Loader2 } from "lucide-react";

interface Props {
  code: string;
  language: string;
}

const ACTIONS = [
  { id: "explain", label: "Explain", icon: Sparkles },
  { id: "fix", label: "Fix Errors", icon: Bug },
  { id: "optimize", label: "Optimize", icon: Zap },
  { id: "generate", label: "Generate", icon: Code2 },
  { id: "convert", label: "Convert", icon: Languages },
];

const AiCodeAssistant = ({ code, language }: Props) => {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const askAI = async (action: string) => {
    setLoading(true);
    setResponse("");
    try {
      const { data, error } = await supabase.functions.invoke("code-ai", {
        body: { action, code, language, customPrompt },
      });
      if (error) throw error;
      setResponse(data?.response || "No response");
    } catch (e: any) {
      setResponse(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-accent" /> AI Code Assistant
        </h3>
        <div className="flex flex-wrap gap-1">
          {ACTIONS.map((a) => (
            <Button key={a.id} variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => askAI(a.id)} disabled={loading}>
              <a.icon className="w-3 h-3" /> {a.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="p-3 border-b border-border">
        <Textarea
          className="text-xs min-h-[60px]"
          placeholder="Ask AI about this code..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
        <Button size="sm" className="w-full mt-2 h-7 text-xs bg-gradient-accent" onClick={() => askAI("custom")} disabled={loading || !customPrompt.trim()}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ask AI"}
        </Button>
      </div>
      <ScrollArea className="flex-1 p-3">
        {loading && !response && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
          </div>
        )}
        {response && (
          <pre className="text-xs whitespace-pre-wrap font-mono">{response}</pre>
        )}
      </ScrollArea>
    </div>
  );
};

export default AiCodeAssistant;
