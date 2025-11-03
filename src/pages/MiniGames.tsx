import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Brain, Timer, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const yogaPoses = [
  { name: "Mountain Pose", sanskrit: "Tadasana" },
  { name: "Downward Dog", sanskrit: "Adho Mukha Svanasana" },
  { name: "Warrior I", sanskrit: "Virabhadrasana I" },
  { name: "Tree Pose", sanskrit: "Vrksasana" },
  { name: "Child's Pose", sanskrit: "Balasana" },
  { name: "Cobra Pose", sanskrit: "Bhujangasana" },
  { name: "Triangle Pose", sanskrit: "Trikonasana" },
  { name: "Corpse Pose", sanskrit: "Savasana" },
];

export default function MiniGames() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [breathingActive, setBreathingActive] = useState(false);

  // Trivia Questions
  const triviaQuestions = [
    {
      question: "What does 'Namaste' mean?",
      options: ["Hello", "The light in me honors the light in you", "Goodbye", "Thank you"],
      correct: 1,
    },
    {
      question: "How many main chakras are there in the body?",
      options: ["5", "7", "9", "11"],
      correct: 1,
    },
    {
      question: "Which pose is known as the 'King of Asanas'?",
      options: ["Headstand", "Lotus", "Warrior", "Mountain"],
      correct: 0,
    },
    {
      question: "What is the original language of yoga?",
      options: ["Hindi", "Sanskrit", "Tamil", "Pali"],
      correct: 1,
    },
  ];

  // Pose Matching Game
  const [matchPairs, setMatchPairs] = useState(
    yogaPoses.slice(0, 4).sort(() => Math.random() - 0.5)
  );
  const [selectedPose, setSelectedPose] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);

  const startGame = (game: string) => {
    setSelectedGame(game);
    setGameStarted(true);
    setScore(0);
    setCurrentQuestion(0);
    setMatchedPairs([]);
    setBreathCount(0);
  };

  const handleTriviaAnswer = (answerIndex: number) => {
    if (answerIndex === triviaQuestions[currentQuestion].correct) {
      setScore(score + 10);
    }
    if (currentQuestion < triviaQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setGameStarted(false);
    }
  };

  const handlePoseMatch = (index: number) => {
    if (matchedPairs.includes(index)) return;
    
    if (selectedPose === null) {
      setSelectedPose(index);
    } else {
      if (selectedPose !== index) {
        setMatchedPairs([...matchedPairs, selectedPose, index]);
        setScore(score + 10);
      }
      setSelectedPose(null);
    }
  };

  const startBreathingExercise = () => {
    setBreathingActive(true);
    setTimeout(() => {
      setBreathCount(breathCount + 1);
      setScore(score + 5);
      setBreathingActive(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Yoga Mini Games</h1>
            <p className="text-muted-foreground">Learn while you play!</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {score > 0 && (
          <Card className="mb-6 bg-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold">Score: {score}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedGame ? (
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame("trivia")}>
              <CardHeader>
                <Brain className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Yoga Trivia</CardTitle>
                <CardDescription>Test your yoga knowledge</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Play Now</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame("matching")}>
              <CardHeader>
                <Sparkles className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Pose Matching</CardTitle>
                <CardDescription>Match poses with Sanskrit names</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Play Now</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame("breathing")}>
              <CardHeader>
                <Timer className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Breathing Exercise</CardTitle>
                <CardDescription>Practice mindful breathing</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Start Exercise</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <Button variant="outline" onClick={() => setSelectedGame(null)} className="mb-4">
              Back to Games
            </Button>

            {selectedGame === "trivia" && gameStarted && (
              <Card>
                <CardHeader>
                  <CardTitle>Question {currentQuestion + 1} of {triviaQuestions.length}</CardTitle>
                  <CardDescription className="text-lg mt-4">
                    {triviaQuestions[currentQuestion].question}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {triviaQuestions[currentQuestion].options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left justify-start"
                      onClick={() => handleTriviaAnswer(index)}
                    >
                      {option}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            {selectedGame === "trivia" && !gameStarted && (
              <Card>
                <CardHeader>
                  <CardTitle>Game Complete!</CardTitle>
                  <CardDescription>Your final score: {score} points</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => startGame("trivia")}>Play Again</Button>
                </CardContent>
              </Card>
            )}

            {selectedGame === "matching" && (
              <Card>
                <CardHeader>
                  <CardTitle>Match Poses with Sanskrit Names</CardTitle>
                  <CardDescription>Click on pairs to match them</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {matchPairs.map((pose, index) => (
                      <Button
                        key={index}
                        variant={matchedPairs.includes(index) ? "default" : selectedPose === index ? "secondary" : "outline"}
                        className="h-20"
                        onClick={() => handlePoseMatch(index)}
                        disabled={matchedPairs.includes(index)}
                      >
                        {index % 2 === 0 ? pose.name : pose.sanskrit}
                      </Button>
                    ))}
                  </div>
                  {matchedPairs.length === matchPairs.length && (
                    <div className="mt-6 text-center">
                      <Badge className="text-lg p-3">Completed! Score: {score}</Badge>
                      <Button className="mt-4 ml-4" onClick={() => startGame("matching")}>
                        Play Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedGame === "breathing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Breathing Exercise</CardTitle>
                  <CardDescription>Follow the breathing pattern</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="my-8">
                    <div
                      className={`mx-auto w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center transition-transform duration-2000 ${
                        breathingActive ? "scale-150" : "scale-100"
                      }`}
                    >
                      <span className="text-2xl font-bold">
                        {breathingActive ? "Breathe In" : "Breathe Out"}
                      </span>
                    </div>
                  </div>
                  <p className="text-lg mb-4">Breaths completed: {breathCount}</p>
                  <Button onClick={startBreathingExercise} disabled={breathingActive}>
                    {breathingActive ? "Breathing..." : "Start Breathing"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
