import Navbar from "@/components/Navbar";
import ChatInterface from "@/components/ChatInterface";
import { Sparkles } from "lucide-react";

const AiAssistant = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-16">
        <div className="bg-gradient-card border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Academic Assistant</h1>
                <p className="text-muted-foreground">
                  Get instant help with your studies, assignments, and academic questions
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-4 py-6">
          <div className="h-full max-w-5xl mx-auto">
            <ChatInterface />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiAssistant;
