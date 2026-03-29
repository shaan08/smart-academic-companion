import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, BookOpen, Target, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-card border border-border mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Academic Excellence</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Your Smart Academic Companion
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Elevate your learning journey with AI-powered tools for studying, career planning, and academic success
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/ai-assistant">
              <Button size="lg" className="bg-gradient-accent shadow-medium hover:shadow-strong transition-all w-full sm:w-auto">
                Try AI Assistant
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2">
              Learn More
            </Button>
          </div>
          
          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <Link to="/ai-assistant" className="block">
              <div className="p-6 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-all border border-border cursor-pointer hover:scale-105 hover:border-primary/50">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 mx-auto">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Study Assistant</h3>
                <p className="text-muted-foreground text-sm">
                  Get instant answers, summaries, and personalized study materials
                </p>
              </div>
            </Link>
            
            <Link to="/career-planning" className="block">
              <div className="p-6 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-all border border-border cursor-pointer hover:scale-105 hover:border-primary/50">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 mx-auto">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Career Planning</h3>
                <p className="text-muted-foreground text-sm">
                  AI resume analysis and interview preparation with real-time feedback
                </p>
              </div>
            </Link>
            
            <Link to="/collaboration" className="block">
              <div className="p-6 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-all border border-border cursor-pointer hover:scale-105 hover:border-primary/50">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Collaboration Hub</h3>
                <p className="text-muted-foreground text-sm">
                  Code together in real-time with your team
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
