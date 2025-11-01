import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, Brain, Zap, ArrowLeft } from "lucide-react";
import PoseFunFacts from "@/components/PoseFunFacts";

interface YogaPose {
  id: string;
  name: string;
  sanskrit_name: string;
  description: string;
  benefits: string;
  difficulty: string;
  mood_tags: string[];
  image_url: string;
  video_url: string;
}

export default function PoseFacts() {
  const { poseId } = useParams();
  const navigate = useNavigate();
  const [pose, setPose] = useState<YogaPose | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPose();
  }, [poseId]);

  const fetchPose = async () => {
    if (!poseId) return;

    const { data, error } = await supabase
      .from("yoga_poses")
      .select("*")
      .eq("id", poseId)
      .single();

    if (error) {
      console.error("Error fetching pose:", error);
    } else {
      setPose(data);
    }
    setLoading(false);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const videoId = url.split("v=")[1] || url.split("/").pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Loading pose details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pose) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Pose not found</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const benefitsList = pose.benefits?.split(".").filter(b => b.trim()) || [];

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{pose.name}</CardTitle>
                {pose.sanskrit_name && (
                  <p className="text-muted-foreground italic text-lg">
                    {pose.sanskrit_name}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {pose.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pose.video_url && (
              <div className="aspect-video mb-6 rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={getYouTubeEmbedUrl(pose.video_url)}
                  title={pose.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {pose.image_url && !pose.video_url && (
              <img
                src={pose.image_url}
                alt={pose.name}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  About This Pose
                </h3>
                <p className="text-muted-foreground leading-relaxed">{pose.description}</p>
              </div>

              {benefitsList.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Health Benefits
                  </h3>
                  <ul className="space-y-2">
                    {benefitsList.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pose.mood_tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Good For
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {pose.mood_tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <PoseFunFacts poseName={pose.name} />

              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={() => navigate(`/yoga-session?mood=${pose.mood_tags[0]}`)}
                >
                  Start Practice Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
