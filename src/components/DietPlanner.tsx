import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Apple, TrendingDown, TrendingUp, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DIET_GOALS = [
  { id: "weight_loss", label: "Weight Loss", icon: TrendingDown },
  { id: "weight_gain", label: "Weight Gain", icon: TrendingUp },
  { id: "belly_fat", label: "Belly Fat Reduction", icon: Target },
  { id: "face_fat", label: "Face Fat Reduction", icon: Target },
  { id: "muscle_gain", label: "Muscle Gain", icon: TrendingUp },
  { id: "healthy_living", label: "Healthy Living", icon: Apple },
];

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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Personalized Diet Plan</CardTitle>
              <Badge variant="secondary">AI Generated</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {dietPlan}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
