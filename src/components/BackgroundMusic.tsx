import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MUSIC_TRACKS = [
  { name: "Meditation Time", url: "https://assets.mixkit.co/music/preview/mixkit-meditation-time-2426.mp3" },
  { name: "Peaceful Garden", url: "https://assets.mixkit.co/music/preview/mixkit-peaceful-garden-meditation-2437.mp3" },
  { name: "Relaxing Vibes", url: "https://assets.mixkit.co/music/preview/mixkit-relaxing-vibes-2421.mp3" },
  { name: "Zen Mode", url: "https://assets.mixkit.co/music/preview/mixkit-deep-meditation-2465.mp3" },
  { name: "Calm Waters", url: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3" },
];

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(MUSIC_TRACKS[currentTrackIndex].url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume[0] / 100;

    // Auto-play next track if one ends (backup for loop)
    audioRef.current.addEventListener('ended', handleNextTrack);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleNextTrack);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.error('Audio play failed:', err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % MUSIC_TRACKS.length);
    setIsPlaying(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg bg-background/95 backdrop-blur-sm hover:scale-110 transition-transform"
          >
            {isPlaying ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">Background Music</div>
              <div className="text-xs text-muted-foreground truncate">
                {MUSIC_TRACKS[currentTrackIndex].name}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={toggleMusic}
                variant={isPlaying ? "default" : "outline"}
                className="flex-1"
              >
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                onClick={handleNextTrack}
                variant="outline"
                size="icon"
                title="Next Track"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Volume</span>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Track {currentTrackIndex + 1} of {MUSIC_TRACKS.length}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default BackgroundMusic;
