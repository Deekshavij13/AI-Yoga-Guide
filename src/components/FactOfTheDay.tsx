import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const facts = [
  "Yoga can improve your flexibility by up to 35% in just 8 weeks of regular practice.",
  "The word 'yoga' comes from the Sanskrit word 'yuj' which means 'to unite or integrate'.",
  "Practicing yoga for just 20 minutes can improve your brain function and focus.",
  "There are over 100 different types of yoga, each with unique benefits and focuses.",
  "Yoga can help reduce chronic pain by up to 22% through regular practice.",
  "Ancient yogis believed that humans take a fixed number of breaths in a lifetime, so breathing slowly extends life.",
  "The tree pose (Vrikshasana) can improve your balance by 30% with consistent practice.",
  "Yoga can boost your immune system by reducing stress hormones and inflammation.",
  "The corpse pose (Savasana) is considered one of the most challenging poses to master.",
  "Regular yoga practice can lower your blood pressure by an average of 10 points.",
];

export function FactOfTheDay() {
  const [fact, setFact] = useState("");

  useEffect(() => {
    const today = new Date().getDate();
    setFact(facts[today % facts.length]);
  }, []);

  return (
    <Card className="border-border/50 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Fun Fact of the Day</h3>
            <p className="text-muted-foreground leading-relaxed">{fact}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
