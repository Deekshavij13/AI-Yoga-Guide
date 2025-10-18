import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [showAllPoses, setShowAllPoses] = useState(false);
  const [allPoses, setAllPoses] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllPoses();
  }, []);

  const fetchAllPoses = async () => {
    const { data, error } = await supabase
      .from("yoga_poses")
      .select("*")
      .order("name");

    if (data) {
      setAllPoses(data);
    }
  };

  const handleStart = () => {
    if (selectedMood) {
      navigate(`/session?mood=${selectedMood}`);
    }
  };

  if (showAllPoses) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">All Yoga Poses</h1>
            <Button variant="outline" onClick={() => setShowAllPoses(false)}>
              Back to Mood Test
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {allPoses.map((pose) => (
              <Card 
                key={pose.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/pose-facts/${pose.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{pose.name}</CardTitle>
                  <CardDescription>{pose.sanskrit_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {pose.image_url && (
                    <img
                      src={pose.image_url}
                      alt={pose.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <Badge variant="secondary">{pose.difficulty}</Badge>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {pose.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowAllPoses(true)}
              className="w-full h-12 text-lg"
            >
              Browse All Poses
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
