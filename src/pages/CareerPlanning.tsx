import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Award, Plus, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CareerPlanning = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState([
    { id: 1, title: "Complete Data Science Certification", progress: 65, deadline: "Dec 2025" },
    { id: 2, title: "Land Software Engineering Internship", progress: 30, deadline: "Summer 2025" },
  ]);

  const [skills, setSkills] = useState([
    { id: 1, name: "Python", level: 80 },
    { id: 2, name: "JavaScript", level: 70 },
    { id: 3, name: "React", level: 65 },
    { id: 4, name: "Machine Learning", level: 45 },
  ]);

  const [coachInput, setCoachInput] = useState("");
  const [coachResponse, setCoachResponse] = useState("");
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const [targetRole, setTargetRole] = useState("");
  const [skillGapResponse, setSkillGapResponse] = useState("");
  const [isSkillGapLoading, setIsSkillGapLoading] = useState(false);

  const [roadmapResponse, setRoadmapResponse] = useState("");
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);

  const handleCoachQuery = async () => {
    if (!coachInput.trim()) {
      toast({
        title: "Input required",
        description: "Please enter your question or describe your situation",
        variant: "destructive",
      });
      return;
    }

    setIsCoachLoading(true);
    setCoachResponse("");

    try {
      const { data, error } = await supabase.functions.invoke('career-ai', {
        body: {
          type: 'coach',
          prompt: coachInput,
          goals,
          skills,
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setCoachResponse(data.response);
    } catch (error: any) {
      console.error('Coach query error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI guidance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCoachLoading(false);
    }
  };

  const handleSkillGapAnalysis = async () => {
    if (!targetRole.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a target role",
        variant: "destructive",
      });
      return;
    }

    setIsSkillGapLoading(true);
    setSkillGapResponse("");

    try {
      const { data, error } = await supabase.functions.invoke('career-ai', {
        body: {
          type: 'skill-gap',
          targetRole,
          skills,
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setSkillGapResponse(data.response);
    } catch (error: any) {
      console.error('Skill gap analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze skill gaps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSkillGapLoading(false);
    }
  };

  const handleRoadmapGeneration = async () => {
    setIsRoadmapLoading(true);
    setRoadmapResponse("");

    try {
      const { data, error } = await supabase.functions.invoke('career-ai', {
        body: {
          type: 'roadmap',
          goals,
          skills,
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setRoadmapResponse(data.response);
    } catch (error: any) {
      console.error('Roadmap generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Career Planning
            </h1>
            <p className="text-muted-foreground">
              Map your career journey, track skills, and achieve your professional goals
            </p>
          </div>

          <Tabs defaultValue="goals" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="paths">Career Paths</TabsTrigger>
            </TabsList>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-4">
              <Card className="border-border/50 shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      <CardTitle>Career Goals</CardTitle>
                    </div>
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Goal
                    </Button>
                  </div>
                  <CardDescription>
                    Set and track your professional objectives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="p-4 rounded-lg bg-gradient-card border border-border/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{goal.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            Due: {goal.deadline}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {goal.progress}%
                        </span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* AI Career Coach */}
              <Card className="border-primary/20 shadow-soft bg-gradient-card">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <CardTitle>AI Career Coach</CardTitle>
                  </div>
                  <CardDescription>
                    Get personalized career advice and goal suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Ask about your career path, next steps, or get goal recommendations..."
                    className="min-h-[100px]"
                    value={coachInput}
                    onChange={(e) => setCoachInput(e.target.value)}
                    disabled={isCoachLoading}
                  />
                  <Button 
                    className="w-full bg-gradient-accent" 
                    onClick={handleCoachQuery}
                    disabled={isCoachLoading}
                  >
                    {isCoachLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Getting AI Guidance...
                      </>
                    ) : (
                      'Get AI Guidance'
                    )}
                  </Button>
                  {coachResponse && (
                    <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border">
                      <p className="text-sm whitespace-pre-wrap">{coachResponse}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4">
              <Card className="border-border/50 shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-secondary" />
                      <CardTitle>Skills Inventory</CardTitle>
                    </div>
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Skill
                    </Button>
                  </div>
                  <CardDescription>
                    Track your professional skills and proficiency levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {skill.level}%
                        </span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-soft">
                <CardHeader>
                  <CardTitle>Skill Gap Analysis</CardTitle>
                  <CardDescription>
                    Identify skills needed for your target roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Enter target role (e.g., Senior Developer)" 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      disabled={isSkillGapLoading}
                    />
                    <Button 
                      className="w-full bg-gradient-accent"
                      onClick={handleSkillGapAnalysis}
                      disabled={isSkillGapLoading}
                    >
                      {isSkillGapLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Skill Gaps'
                      )}
                    </Button>
                    {skillGapResponse && (
                      <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border">
                        <p className="text-sm whitespace-pre-wrap">{skillGapResponse}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Career Paths Tab */}
            <TabsContent value="paths" className="space-y-4">
              <Card className="border-border/50 shadow-soft">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <CardTitle>Career Pathways</CardTitle>
                  </div>
                  <CardDescription>
                    Explore different career trajectories based on your profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-gradient-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <h3 className="font-semibold mb-2">Software Engineer → Tech Lead</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Lead technical teams and architecture decisions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">5-7 years</Badge>
                        <Badge variant="outline">Leadership</Badge>
                        <Badge variant="outline">Architecture</Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <h3 className="font-semibold mb-2">Data Analyst → Data Scientist</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Build ML models and drive data-driven insights
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">3-5 years</Badge>
                        <Badge variant="outline">ML</Badge>
                        <Badge variant="outline">Statistics</Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <h3 className="font-semibold mb-2">Frontend Dev → Product Manager</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Shape product strategy and user experience
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">4-6 years</Badge>
                        <Badge variant="outline">Product</Badge>
                        <Badge variant="outline">Strategy</Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <h3 className="font-semibold mb-2">Developer → Entrepreneur</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Launch and scale your own tech venture
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Variable</Badge>
                        <Badge variant="outline">Business</Badge>
                        <Badge variant="outline">Innovation</Badge>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-hero" 
                    size="lg"
                    onClick={handleRoadmapGeneration}
                    disabled={isRoadmapLoading}
                  >
                    {isRoadmapLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Roadmap...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Get Personalized Career Roadmap
                      </>
                    )}
                  </Button>
                  {roadmapResponse && (
                    <div className="mt-4 p-6 rounded-lg bg-background/50 border border-border">
                      <h3 className="font-semibold mb-3">Your Personalized Career Roadmap</h3>
                      <p className="text-sm whitespace-pre-wrap">{roadmapResponse}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CareerPlanning;
