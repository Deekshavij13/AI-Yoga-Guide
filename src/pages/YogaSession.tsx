import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectPoseFromVideo, analyzePose, initializePoseDetection } from "@/utils/poseDetection";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Timer, ArrowLeft } from "lucide-react";

type YogaPose = {
  id: string;
  name: string;
  sanskrit_name: string;
  description: string;
  benefits: string;
  difficulty: string;
  duration_seconds: number;
  image_url?: string;
  video_url?: string;
};

export default function YogaSession() {
  const [searchParams] = useSearchParams();
  const mood = searchParams.get("mood") || "calm";
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [poseAccuracy, setPoseAccuracy] = useState(0);
  const [currentPose, setCurrentPose] = useState<YogaPose | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch recommended pose based on mood
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchRecommendedPose = async () => {
      const { data, error } = await supabase
        .from("yoga_poses")
        .select("*")
        .contains("mood_tags", [mood])
        .order("difficulty")
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching pose:", error);
        toast({
          title: "Error",
          description: "Failed to load yoga pose",
          variant: "destructive",
        });
        return;
      }

      setCurrentPose(data);
    };

    fetchRecommendedPose();
    initializePoseDetection().then(() => setIsInitialized(true));
    audioContextRef.current = new AudioContext();

    return () => {
      stopDetection();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [user, mood, navigate, toast]);

  // Timer for session
  useEffect(() => {
    if (isSessionActive && currentPose) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev + 1;
          if (newTime >= currentPose.duration_seconds) {
            handlePoseComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, currentPose]);

  const playBeep = () => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.5);
  };

  const handlePoseComplete = async () => {
    setIsSessionActive(false);
    setIsDetecting(false);
    
    const points = Math.round(poseAccuracy * 10);
    setSessionPoints((prev) => prev + points);

    // Save session to database
    if (user && currentPose) {
      await supabase.from("pose_sessions").insert({
        user_id: user.id,
        pose_id: currentPose.id,
        points_earned: points,
        accuracy_score: poseAccuracy,
      });

      // Update total points
      const { data: existingPoints } = await supabase
        .from("user_points")
        .select("total_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingPoints) {
        await supabase
          .from("user_points")
          .update({ total_points: existingPoints.total_points + points })
          .eq("user_id", user.id);
      } else {
        await supabase.from("user_points").insert({
          user_id: user.id,
          total_points: points,
        });
      }
    }

    toast({
      title: "Pose Complete!",
      description: `You earned ${points} points! Accuracy: ${Math.round(poseAccuracy * 100)}%`,
    });

    // Record check-in
    if (user) {
      await supabase.from("check_ins").insert({
        user_id: user.id,
        duration_minutes: Math.round(currentPose!.duration_seconds / 60),
        poses_completed: 1,
      });
    }
  };

  const detectPose = async () => {
    if (!videoRef.current || !canvasRef.current || !isDetecting) return;

    const landmarks = await detectPoseFromVideo(videoRef.current, canvasRef.current);
    
    if (landmarks && landmarks.length > 0) {
      const analysis = analyzePose(landmarks);
      const accuracy = Math.random() * 0.3 + 0.6; // Simulated accuracy
      setPoseAccuracy(accuracy);

      if (accuracy < 0.7) {
        playBeep();
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectPose);
  };

  const startDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsDetecting(true);
    setIsSessionActive(true);
    setTimer(0);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
    });

    videoRef.current.srcObject = stream;
    videoRef.current.play();

    detectPose();
  };

  const stopDetection = () => {
    setIsDetecting(false);
    setIsSessionActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleEndSession = async () => {
    stopDetection();
    
    toast({
      title: "Session Complete!",
      description: `Total points earned: ${sessionPoints}`,
    });

    navigate("/dashboard");
  };

  if (!currentPose) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">Loading your personalized session...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Points */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-center">
              Yoga Session
            </h1>
            <p className="text-muted-foreground mt-1 text-center">Mood: {mood}</p>
          </div>
          <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-primary/20">
            <Trophy className="w-6 h-6 text-primary" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Points</div>
              <div className="text-2xl font-bold text-primary">{sessionPoints}</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pose Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentPose.name}</span>
                <Badge variant={currentPose.difficulty === "beginner" ? "secondary" : currentPose.difficulty === "intermediate" ? "default" : "destructive"}>
                  {currentPose.difficulty}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground italic">{currentPose.sanskrit_name}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPose.image_url && (
                <img
                  src={currentPose.image_url}
                  alt={currentPose.name}
                  className="w-full rounded-lg aspect-video object-cover"
                />
              )}

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-sm text-muted-foreground">{currentPose.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Benefits</h3>
                <p className="text-sm text-muted-foreground">{currentPose.benefits}</p>
              </div>

              <div className="bg-secondary/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Duration
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {isSessionActive ? `${timer}s / ${currentPose.duration_seconds}s` : `${currentPose.duration_seconds}s`}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(timer / currentPose.duration_seconds) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Feed */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {currentPose.video_url ? (
                  <video
                    src={currentPose.video_url}
                    controls
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="hidden"
                      playsInline
                    />
                    <canvas
                      ref={canvasRef}
                      width={1280}
                      height={720}
                      className="w-full h-full object-contain"
                    />
                    {!isInitialized && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <p className="text-white text-lg">Initializing AI model...</p>
                      </div>
                    )}
                  </>
                )}
                
                {isDetecting && (
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-primary/20">
                    <div className="text-xs font-semibold text-muted-foreground">Pose Accuracy</div>
                    <div className={`text-3xl font-bold ${poseAccuracy > 0.7 ? "text-green-500" : "text-red-500"}`}>
                      {Math.round(poseAccuracy * 100)}%
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  onClick={isDetecting ? stopDetection : startDetection}
                  className="w-full h-12 text-lg"
                  variant={isDetecting ? "destructive" : "default"}
                  disabled={!isInitialized && !currentPose.video_url}
                >
                  {isDetecting ? "Pause Practice" : "Start Practice"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleEndSession}
                    variant="outline"
                    className="w-full"
                  >
                    End Session
                  </Button>
                  <Button
                    onClick={() => navigate("/mood-test")}
                    variant="outline"
                    className="w-full"
                  >
                    Change Pose
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
