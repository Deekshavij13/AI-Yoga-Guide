import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Apple, TrendingDown, TrendingUp, Target, Flame, Droplet, Utensils, Heart, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const DIET_GOALS = [
  { id: "weight_loss", label: "Weight Loss", icon: TrendingDown },
  { id: "weight_gain", label: "Weight Gain", icon: TrendingUp },
  { id: "belly_fat", label: "Belly Fat Reduction", icon: Target },
  { id: "face_fat", label: "Face Fat Reduction", icon: Target },
  { id: "muscle_gain", label: "Muscle Gain", icon: TrendingUp },
  { id: "healthy_living", label: "Healthy Living", icon: Apple },
];

// Helper component to render diet plan with visual enhancements
function DietPlanRenderer({ content }: { content: string }) {
  const sections = content.split('\n\n');
  
  const getSectionIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('calorie')) return <Flame className="h-5 w-5 text-orange-500" />;
    if (lower.includes('macro') || lower.includes('protein') || lower.includes('carb')) return <TrendingUp className="h-5 w-5 text-blue-500" />;
    if (lower.includes('meal') || lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner')) return <Utensils className="h-5 w-5 text-green-500" />;
    if (lower.includes('hydration') || lower.includes('water')) return <Droplet className="h-5 w-5 text-cyan-500" />;
    if (lower.includes('tip') || lower.includes('success')) return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    if (lower.includes('include') || lower.includes('foods to')) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (lower.includes('avoid')) return <XCircle className="h-5 w-5 text-red-500" />;
    return <Target className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0) return null;
        
        const isHeader = lines[0].match(/^\d+\.|^[A-Z][^.]*:/);
        
        return (
          <div key={idx} className="space-y-3">
            {isHeader && (
              <>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border-l-4 border-primary">
                  {getSectionIcon(lines[0])}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-primary mb-2">{lines[0]}</h3>
                    <div className="space-y-2">
                      {lines.slice(1).map((line, i) => {
                        const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•');
                        const cleanLine = line.replace(/^[-•]\s*/, '');
                        
                        return (
                          <div key={i} className={`${isBullet ? 'flex items-start gap-2 ml-2' : ''}`}>
                            {isBullet && <span className="text-primary mt-1">•</span>}
                            <p className="text-sm leading-relaxed">
                              {cleanLine.split('**').map((part, j) => 
                                j % 2 === 1 ? (
                                  <strong key={j} className="text-secondary font-semibold">{part}</strong>
                                ) : (
                                  <span key={j}>{part}</span>
                                )
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {idx < sections.length - 1 && <Separator className="my-4" />}
              </>
            )}
            {!isHeader && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {section}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DietPlanner() {
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [userInfo, setUserInfo] = useState("");
  const [dietPlan, setDietPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateDietPlan = async () => {
    if (!selectedGoal) {
      toast({
        title: "Select a Goal",
        description: "Please select your diet goal first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDietPlan("");

    const goalLabel = DIET_GOALS.find(g => g.id === selectedGoal)?.label || selectedGoal;
    
    const prompt = `As a professional nutritionist, create a personalized diet plan for ${goalLabel}.

User Information: ${userInfo || "No specific information provided"}

Please provide:
1. Daily calorie target
2. Macronutrient breakdown (protein, carbs, fats)
3. Sample meal plan for one day (breakfast, lunch, dinner, snacks)
4. Foods to include and avoid
5. Hydration recommendations
6. 3 practical tips for success

Keep the plan realistic, healthy, and sustainable. Format it clearly with sections.`;

    try {
      const { data, error } = await supabase.functions.invoke("yoga-chat", {
        body: { message: prompt },
      });

      if (error) throw error;

      setDietPlan(data.response);
      toast({
        title: "Diet Plan Generated!",
        description: "Your personalized plan is ready",
      });
    } catch (error) {
      console.error("Error generating diet plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate diet plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-primary" />
            AI Diet Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Your Goal
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DIET_GOALS.map((goal) => {
                const Icon = goal.icon;
                return (
                  <Button
                    key={goal.id}
                    variant={selectedGoal === goal.id ? "default" : "outline"}
                    className="h-auto py-3 px-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedGoal(goal.id)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs text-center">{goal.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Information (Optional)
            </label>
            <Textarea
              placeholder="E.g., age, weight, height, dietary restrictions, food preferences, activity level..."
              value={userInfo}
              onChange={(e) => setUserInfo(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={generateDietPlan}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Your Plan...
              </>
            ) : (
              "Generate Diet Plan"
            )}
          </Button>
        </CardContent>
      </Card>

      {dietPlan && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Utensils className="h-6 w-6 text-primary" />
                Your Personalized Diet Plan
              </CardTitle>
              <Badge variant="secondary" className="text-sm">
                <Heart className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <DietPlanRenderer content={dietPlan} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
