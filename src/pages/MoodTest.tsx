import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const moodOptions = [
  { value: "stressed", label: "Stressed", description: "Feeling overwhelmed or tense" },
  { value: "anxious", label: "Anxious", description: "Feeling worried or nervous" },
  { value: "tired", label: "Tired", description: "Low energy, need rest" },
  { value: "energized", label: "Energized", description: "Full of energy, ready for action" },
  { value: "calm", label: "Calm", description: "Peaceful and centered" },
  { value: "focused", label: "Focused", description: "Clear mind, ready to concentrate" },
  { value: "sad", label: "Sad", description: "Feeling down or low" },
  { value: "confident", label: "Confident", description: "Strong and empowered" },
];

export default function MoodTest() {
  const [selectedMood, setSelectedMood] = useState("");
  const navigate = useNavigate();

  const handleStart = () => {
    if (selectedMood) {
      navigate(`/session?mood=${selectedMood}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="backdrop-blur-sm bg-background/95">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              How Are You Feeling Today?
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Select your current mood and we'll recommend the perfect yoga poses for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedMood} onValueChange={setSelectedMood}>
              <div className="grid gap-4">
                {moodOptions.map((mood) => (
                  <div key={mood.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={mood.value} id={mood.value} className="mt-1" />
                    <Label htmlFor={mood.value} className="flex-1 cursor-pointer">
                      <div className="font-semibold text-foreground">{mood.label}</div>
                      <div className="text-sm text-muted-foreground">{mood.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Button
              onClick={handleStart}
              disabled={!selectedMood}
              className="w-full h-12 text-lg"
            >
              Start Your Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
