import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const facts = [
  {
    title: "Perfect Your Warrior Pose",
    description: "Keep your front knee directly over your ankle to protect your joints and maximize strength building.",
  },
  {
    title: "Breathing Technique",
    description: "Inhale during expansive movements and exhale during contracting movements for optimal energy flow.",
  },
  {
    title: "Morning vs Evening Practice",
    description: "Morning yoga boosts energy and flexibility, while evening practice promotes better sleep and relaxation.",
  },
  {
    title: "Alignment Tip",
    description: "In downward dog, spread your fingers wide and press through your palms to protect your wrists.",
  },
];

const hacks = [
  {
    title: "Use a Strap for Flexibility",
    description: "Can't reach your toes? Use a yoga strap or belt to gradually increase your flexibility safely.",
  },
  {
    title: "Wall Support for Balance",
    description: "Practice balance poses near a wall for support as you build strength and confidence.",
  },
  {
    title: "Block for Deeper Stretches",
    description: "Place blocks under your hands in forward folds to bring the ground closer and prevent strain.",
  },
  {
    title: "Micro-Practice Routine",
    description: "Do 5 minutes of yoga upon waking to energize your day without overwhelming your schedule.",
  },
];

export function PoseFunFacts() {
  return (
    <Card className="border-border/50 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 mb-4">
          <Lightbulb className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Yoga Wisdom</h3>
            <p className="text-sm text-muted-foreground">Amazing facts and practical hacks for your practice</p>
          </div>
        </div>
        <Tabs defaultValue="facts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="facts">Facts</TabsTrigger>
            <TabsTrigger value="hacks">Hacks</TabsTrigger>
          </TabsList>
          <TabsContent value="facts" className="space-y-3 mt-4">
            {facts.map((fact, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                <Star className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">{fact.title}</h4>
                  <p className="text-sm text-muted-foreground">{fact.description}</p>
                </div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="hacks" className="space-y-3 mt-4">
            {hacks.map((hack, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors">
                <Lightbulb className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">{hack.title}</h4>
                  <p className="text-sm text-muted-foreground">{hack.description}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
