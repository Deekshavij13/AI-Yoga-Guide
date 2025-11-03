import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Flame, LogOut, Trophy, TrendingUp, Gamepad2, BookOpen, Apple } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { FactOfTheDay } from "@/components/FactOfTheDay";
import { PoseFunFacts } from "@/components/PoseFunFacts";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [recentCheckIns, setRecentCheckIns] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      if (!user) return;

      // Fetch streak data
      const { data: streakData } = await supabase
        .from("streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", user.id)
        .single();

      if (streakData) {
        setStreak(streakData.current_streak);
        setLongestStreak(streakData.longest_streak);
      }

      // Fetch points
      const { data: pointsData } = await supabase
        .from("user_points")
        .select("total_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pointsData) {
        setTotalPoints(pointsData.total_points);
      }

      // Fetch recent check-ins (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: checkInsData, count } = await supabase
        .from("check_ins")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .gte("date", sevenDaysAgo.toISOString());

      setRecentCheckIns(count || 0);

      // Fetch recent sessions
      const { data: sessionsData } = await supabase
        .from("pose_sessions")
        .select(`
          *,
          yoga_poses (name, sanskrit_name)
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(5);

      setRecentSessions(sessionsData || []);
    };

    fetchData();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Virtual Yoga Guide
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back to your practice</p>
          </div>
          <div className="flex gap-2">
            <ThemeSelector />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <FactOfTheDay />
        
        <PoseFunFacts />

        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalPoints}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streak} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Keep it up!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{longestStreak} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Personal best
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentCheckIns} sessions</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Start New Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Take a mood test to get personalized yoga pose recommendations
              </p>
              <Button
                onClick={() => navigate("/mood-test")}
                className="w-full"
                size="lg"
              >
                Begin Mood Test
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Mini Games
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Learn yoga through fun interactive games
              </p>
              <Button
                onClick={() => navigate("/mini-games")}
                className="w-full"
                size="lg"
                variant="outline"
              >
                Play Games
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Explore Poses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Discover benefits and watch video guides
              </p>
              <Button
                onClick={() => navigate("/mood-test")}
                className="w-full"
                size="lg"
                variant="outline"
              >
                Browse Poses
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                Diet Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Get AI-powered personalized diet plans
              </p>
              <Button
                onClick={() => navigate("/diet-planner")}
                className="w-full"
                size="lg"
                variant="outline"
              >
                Create Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                    <div>
                      <div className="font-semibold text-sm">{session.yoga_poses.name}</div>
                      <div className="text-xs text-muted-foreground">{session.yoga_poses.sanskrit_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">+{session.points_earned}</div>
                      <div className="text-xs text-muted-foreground">{Math.round(session.accuracy_score * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No sessions yet. Start your first one!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
