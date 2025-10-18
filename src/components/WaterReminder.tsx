import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Droplet, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function WaterReminder() {
  const [showReminder, setShowReminder] = useState(false);
  const [waterCount, setWaterCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowReminder(true);
      toast({
        title: "💧 Time to Hydrate!",
        description: "Remember to drink water during your yoga practice",
      });
    }, 20 * 60 * 1000); // Every 20 minutes

    return () => clearInterval(interval);
  }, []);

  const handleDrink = () => {
    setWaterCount(waterCount + 1);
    setShowReminder(false);
    toast({
      title: "Great job! 💧",
      description: `You've had ${waterCount + 1} glasses today`,
    });
  };

  if (!showReminder) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Card className="w-80 shadow-lg border-primary">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Droplet className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Hydration Reminder</h3>
                <p className="text-sm text-muted-foreground">Stay hydrated!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowReminder(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button className="w-full" onClick={handleDrink}>
            I Drank Water
          </Button>
          <p className="text-xs text-center mt-2 text-muted-foreground">
            Glasses today: {waterCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
