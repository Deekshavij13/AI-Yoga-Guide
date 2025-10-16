import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { detectPoseFromVideo, analyzePose, initializePoseDetection } from '@/utils/poseDetection';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Play, Square, AlertCircle } from 'lucide-react';

const YogaSession = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState('Position yourself in frame');
  const [posesCompleted, setPosesCompleted] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setupCamera();
    initializePoseDetection().then(() => setIsInitialized(true));
    audioContextRef.current = new AudioContext();

    return () => {
      stopCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [user, navigate]);

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
      }
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please grant permission.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const playBeep = () => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.5);
  };

  const detectPose = async () => {
    if (!videoRef.current || !canvasRef.current || !isRecording) return;

    const landmarks = await detectPoseFromVideo(videoRef.current, canvasRef.current);
    
    if (landmarks && landmarks.length > 0) {
      const analysis = analyzePose(landmarks);
      setFeedback(analysis.feedback);
      
      if (!analysis.isCorrect) {
        playBeep();
      } else {
        setPosesCompleted(prev => prev + 1);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectPose);
  };

  const startSession = () => {
    setIsRecording(true);
    startTimeRef.current = Date.now();
    setPosesCompleted(0);
    detectPose();
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setSessionDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  };

  const endSession = async () => {
    setIsRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const durationMinutes = Math.floor(sessionDuration / 60);

    if (user) {
      // Save check-in
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          poses_completed: posesCompleted,
          date: new Date().toISOString().split('T')[0]
        });

      if (checkInError) {
        console.error('Error saving check-in:', checkInError);
      } else {
        // Update streak
        const { data: streakData } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (streakData) {
          const today = new Date().toISOString().split('T')[0];
          const lastCheckIn = streakData.last_check_in_date;
          
          let newStreak = streakData.current_streak;
          
          if (lastCheckIn) {
            const daysDiff = Math.floor(
              (new Date(today).getTime() - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysDiff === 1) {
              newStreak += 1;
            } else if (daysDiff > 1) {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }

          const longestStreak = Math.max(streakData.longest_streak, newStreak);

          await supabase
            .from('streaks')
            .update({
              current_streak: newStreak,
              longest_streak: longestStreak,
              last_check_in_date: today,
            })
            .eq('user_id', user.id);
        }

        toast({
          title: 'Session Completed!',
          description: `Great work! ${posesCompleted} poses completed in ${durationMinutes} minutes.`,
        });
      }
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Yoga Session
            </h1>
            <p className="text-muted-foreground">AI-Powered Pose Correction</p>
          </div>
          
          <div className="w-32" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-border/50 shadow-lg overflow-hidden">
              <CardContent className="p-0 relative">
                <div className="relative bg-black aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                  />
                  
                  {!isInitialized && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <p className="text-white text-lg">Initializing AI model...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/50 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Live Feedback</p>
                    <p className="text-sm text-muted-foreground mt-1">{feedback}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-medium">{Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Poses</span>
                    <span className="font-medium text-primary">{posesCompleted}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-md">
              <CardContent className="pt-6">
                {!isRecording ? (
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={startSession}
                    disabled={!isInitialized}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Start Practice
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-full"
                    onClick={endSession}
                  >
                    <Square className="mr-2 h-5 w-5" />
                    End Session
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-muted/30">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3">Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Position yourself in the center of the frame</li>
                  <li>• Ensure good lighting for better detection</li>
                  <li>• Listen for beep sounds when pose needs correction</li>
                  <li>• Hold each pose steady for best results</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YogaSession;