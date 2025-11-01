import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { CustomThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import YogaSession from "./pages/YogaSession";
import MoodTest from "./pages/MoodTest";
import MiniGames from "./pages/MiniGames";
import PoseFacts from "./pages/PoseFacts";
import DietPlannerPage from "./pages/DietPlanner";
import NotFound from "./pages/NotFound";
import WaterReminder from "@/components/WaterReminder";
import YogaChatbot from "@/components/YogaChatbot";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useCustomTheme } from "@/hooks/useTheme";

const queryClient = new QueryClient();

function AppContent() {
  const { customTheme } = useCustomTheme();
  
  return (
    <>
      <AnimatedBackground theme={customTheme} />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mood-test" element={<MoodTest />} />
        <Route path="/session" element={<YogaSession />} />
        <Route path="/mini-games" element={<MiniGames />} />
        <Route path="/pose-facts/:poseId" element={<PoseFacts />} />
        <Route path="/diet-planner" element={<DietPlannerPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <WaterReminder />
      <YogaChatbot />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <CustomThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </CustomThemeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
