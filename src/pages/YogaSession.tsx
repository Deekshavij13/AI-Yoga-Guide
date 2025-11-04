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
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [lastMovementTime, setLastMovementTime] = useState(Date.now());
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

  const playBeep = (isError = false) => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    // Different frequencies for different alerts
    oscillator.frequency.value = isError ? 400 : 800; // Lower frequency for errors
    oscillator.type = "square"; // More noticeable sound
    
    gainNode.gain.setValueAtTime(0.4, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.3);
    
    // Play double beep for errors
    if (isError) {
      setTimeout(() => {
        const osc2 = audioContextRef.current!.createOscillator();
        const gain2 = audioContextRef.current!.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContextRef.current!.destination);
        osc2.frequency.value = 400;
        osc2.type = "square";
        gain2.gain.setValueAtTime(0.4, audioContextRef.current!.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.3);
        osc2.start();
        osc2.stop(audioContextRef.current!.currentTime + 0.3);
      }, 200);
    }
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
      
      // Reset idle state if pose detected
      setLastMovementTime(Date.now());
      setIsIdle(false);

      // Play alert sound for incorrect pose
      if (accuracy < 0.6) {
        playBeep(true); // Double beep for wrong pose
      } else if (accuracy < 0.75) {
        playBeep(false); // Single beep for improvement needed
      }
    } else {
      // No landmarks detected - user might be idle
      const timeSinceMovement = Date.now() - lastMovementTime;
      if (timeSinceMovement > 3000 && !isIdle) { // 3 seconds of no movement
        setIsIdle(true);
        playBeep(true); // Alert for being idle
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectPose);
  };

  const startDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setIsDetecting(true);
      setIsSessionActive(true);
      setTimer(0);
      setLastMovementTime(Date.now());
      setIsIdle(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      
      // Wait for video metadata to load before playing
      await new Promise<void>((resolve) => {
        videoRef.current!.onloadedmetadata = () => {
          resolve();
        };
      });
      
      await videoRef.current.play();
      
      // Wait a bit for the video to actually start rendering frames
      await new Promise(resolve => setTimeout(resolve, 500));

      detectPose();
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use pose detection. Make sure you're using HTTPS or localhost.",
        variant: "destructive",
      });
      setIsDetecting(false);
      setIsSessionActive(false);
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">Loading your personalized session...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
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

        {/* Pose Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{currentPose.name}</CardTitle>
                <p className="text-muted-foreground italic mt-1">{currentPose.sanskrit_name}</p>
              </div>
              <Badge variant={currentPose.difficulty === "beginner" ? "secondary" : currentPose.difficulty === "intermediate" ? "default" : "destructive"}>
                {currentPose.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Split View: Reference Pose and User Camera */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Reference Pose Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Reference Pose</CardTitle>
              <p className="text-sm text-muted-foreground text-center">Match this position</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="aspect-[3/4] bg-secondary/20 rounded-lg overflow-hidden relative border-4 border-primary/30">
                {currentPose.video_url ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={currentPose.video_url.includes('youtube') 
                      ? `https://www.youtube.com/embed/${currentPose.video_url.split('v=')[1] || currentPose.video_url.split('/').pop()}?autoplay=1&loop=1&mute=1`
                      : currentPose.video_url}
                    title={currentPose.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : currentPose.image_url ? (
                  <img
                    src={currentPose.image_url}
                    alt={currentPose.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No reference image available</p>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  Target Pose
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Camera Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Your Practice</CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                {isDetecting ? "AI is analyzing your pose..." : "Start practice to begin"}
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="aspect-[3/4] bg-black rounded-lg overflow-hidden relative border-4 border-secondary/30">
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                      <p className="text-white text-lg">Initializing AI model...</p>
                    </div>
                  </div>
                )}
                
                {!isDetecting && isInitialized && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center text-white">
                      <p className="text-xl mb-2">Ready to start?</p>
                      <p className="text-sm opacity-80">Click "Start Practice" below</p>
                    </div>
                  </div>
                )}
                
                {isDetecting && (
                  <>
                    <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-primary/30 shadow-lg">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Accuracy</div>
                      <div className="flex items-center gap-2">
                        <div className={`text-3xl font-bold ${poseAccuracy > 0.8 ? "text-green-500" : poseAccuracy > 0.6 ? "text-yellow-500" : "text-red-500"}`}>
                          {Math.round(poseAccuracy * 100)}%
                        </div>
                        {poseAccuracy > 0.8 && <span className="text-green-500">✓</span>}
                        {poseAccuracy < 0.6 && <span className="text-red-500 animate-pulse">!</span>}
                      </div>
                      {isIdle && (
                        <div className="text-xs text-red-500 font-semibold mt-1 animate-pulse">
                          Move into position!
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-primary/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">Time</span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {timer}s / {currentPose.duration_seconds}s
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 mt-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(timer / currentPose.duration_seconds) * 100}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  onClick={isDetecting ? stopDetection : startDetection}
                  className="w-full h-12 text-lg"
                  variant={isDetecting ? "destructive" : "default"}
                  disabled={!isInitialized}
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

        {/* Instructions Card */}
        {isDetecting && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    poseAccuracy > 0.8 ? "bg-green-500/20 text-green-500" : 
                    poseAccuracy > 0.6 ? "bg-yellow-500/20 text-yellow-500" : 
                    "bg-red-500/20 text-red-500"
                  }`}>
                    {poseAccuracy > 0.8 ? "😊" : poseAccuracy > 0.6 ? "🤔" : "😅"}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">
                    {isIdle ? "⚠️ No movement detected!" :
                     poseAccuracy > 0.8 ? "Excellent! Hold this position" : 
                     poseAccuracy > 0.6 ? "Good! Minor adjustments needed" : 
                     "Keep trying! Compare with reference"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {poseAccuracy > 0.8 ? "You're matching the pose perfectly. Maintain this position until the timer completes." : 
                     poseAccuracy > 0.6 ? "Your pose is close! Look at the reference image and make small adjustments." : 
                     "Position yourself to match the reference pose. Focus on alignment and posture."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
