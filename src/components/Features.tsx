import { Bot, FileText, MessageSquare, BarChart, Calendar, Shield } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Academic Assistant",
    description: "Ask questions, get summaries, check grammar, and generate study notes with advanced AI technology."
  },
  {
    icon: FileText,
    title: "Resume Analyzer",
    description: "Upload your resume and get AI-powered feedback to optimize it for your target roles."
  },
  {
    icon: MessageSquare,
    title: "Interview Practice",
    description: "Simulate real interviews with AI and receive detailed feedback on your performance."
  },
  {
    icon: BarChart,
    title: "Progress Tracking",
    description: "Monitor your academic progress with comprehensive analytics and insights."
  },
  {
    icon: Calendar,
    title: "Task Management",
    description: "Organize assignments, deadlines, and study sessions all in one place."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and protected with enterprise-grade security."
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-muted-foreground">
            Comprehensive tools designed to elevate your academic journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-all border border-border group"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-card flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
