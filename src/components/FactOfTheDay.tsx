import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const yogaFacts = [
  "Yoga originated in ancient India over 5,000 years ago.",
  "The word 'yoga' comes from Sanskrit and means 'to yoke' or 'to unite'.",
  "Regular yoga practice can improve flexibility, strength, and mental clarity.",
  "There are over 100 different types of yoga practices.",
  "Yoga can help reduce stress and anxiety by lowering cortisol levels.",
  "The oldest known yoga scripture is the Rig Veda, dating back to 1500 BCE.",
  "Practicing yoga regularly can improve your sleep quality.",
  "Yoga helps improve posture and reduces back pain.",
  "Breathing exercises (pranayama) can increase lung capacity by up to 15%.",
  "Hot yoga can help burn up to 600 calories per session.",
  "Yoga has been shown to boost immune system function.",
  "The practice of yoga can help lower blood pressure naturally.",
];

const FactOfTheDay = () => {
  const [fact, setFact] = useState("");

  useEffect(() => {
    const today = new Date().getDate();
    setFact(yogaFacts[today % yogaFacts.length]);
  }, []);

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-none">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-sm mb-1">Fact of the Day</h3>
          <p className="text-sm text-muted-foreground">{fact}</p>
        </div>
      </div>
    </Card>
  );
};

export default FactOfTheDay;
