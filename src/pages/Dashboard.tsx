import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Calendar, Activity, LogOut, Camera } from 'lucide-react';

interface Streak {
  current_streak: number;
  longest_streak: number;
}

interface CheckIn {
  date: string;
  poses_completed: number;
  duration_minutes: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;

    // Load streak data
    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (streakData) {
      setStreak(streakData);
    }

    // Load recent check-ins
    const { data: checkInsData } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7);

    if (checkInsData) {
      setRecentCheckIns(checkInsData);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Yoga Guide
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back to your practice</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{streak?.current_streak || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">days in a row</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
              <Calendar className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{streak?.longest_streak || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">personal best</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{recentCheckIns.length}</div>
              <p className="text-xs text-muted-foreground mt-1">practice sessions</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Start Your Practice</CardTitle>
            <CardDescription>Begin a new yoga session with AI-powered pose correction</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
              onClick={() => navigate('/session')}
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Yoga Session
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent yoga sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sessions yet. Start your first practice!
              </p>
            ) : (
              <div className="space-y-4">
                {recentCheckIns.map((checkIn, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{new Date(checkIn.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {checkIn.poses_completed} poses completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        {checkIn.duration_minutes} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;