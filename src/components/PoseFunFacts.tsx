import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PoseFunFactsProps {
  poseName: string;
}

const funFactsDatabase: Record<string, string[]> = {
  "Tree Pose": [
    "In India, the tree is a symbol of wisdom and longevity",
    "This pose improves focus and concentration within 30 seconds",
    "Tree Pose activates the same brain regions as meditation"
  ],
  "Warrior Pose": [
    "Named after Virabhadra, a fierce warrior in Hindu mythology",
    "Warriors in ancient times practiced this pose before battle",
    "This pose can increase stamina by 25% with regular practice"
  ],
  "Downward Dog": [
    "Dogs naturally perform this stretch after waking up",
    "Ancient yogis observed animals for pose inspiration",
    "This is one of the most recognized yoga poses worldwide"
  ],
  "Child's Pose": [
    "This is a natural resting position for children",
    "It's one of the safest poses to practice during pregnancy",
    "Child's Pose can lower blood pressure in just 3 minutes"
  ],
  "Cobra Pose": [
    "Cobras rise up in a similar defensive posture",
    "Ancient Egyptian art shows poses similar to Bhujangasana",
    "This pose can improve spine flexibility by 40% over 3 months"
  ],
  "Mountain Pose": [
    "Considered the foundation of all standing poses",
    "Practiced correctly, it engages over 200 muscles",
    "Mountains represent stability in many spiritual traditions"
  ],
  "Crow Pose": [
    "Crows are symbols of intelligence and balance in many cultures",
    "This was traditionally taught only to advanced practitioners",
    "Building to Crow Pose can take 3-6 months of consistent practice"
  ],
  "default": [
    "Yoga has been practiced for over 5,000 years",
    "Regular practice can reduce stress hormones by 40%",
    "This pose helps align your chakras and energy flow"
  ]
};

const PoseFunFacts = ({ poseName }: PoseFunFactsProps) => {
  const facts = funFactsDatabase[poseName] || funFactsDatabase.default;
  
  return (
    <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">Fun Facts</h3>
        </div>
        {facts.map((fact, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
            <p className="text-sm text-amber-900 dark:text-amber-100">{fact}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PoseFunFacts;
