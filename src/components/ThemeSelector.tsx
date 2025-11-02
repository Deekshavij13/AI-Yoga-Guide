import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";
import { useCustomTheme, CustomTheme } from "@/hooks/useTheme";

const themes = [
  { id: "aurora" as CustomTheme, name: "Aurora Nights", icon: "🌌" },
  { id: "sunrise" as CustomTheme, name: "Sunrise Charm", icon: "🌅" },
  { id: "moonlight" as CustomTheme, name: "Moonlight Love", icon: "🌙" },
  { id: "default" as CustomTheme, name: "Floral Evening", icon: "🌸" },
];

export function ThemeSelector() {
  const { customTheme, setCustomTheme } = useCustomTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative group">
          <Palette className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setCustomTheme(theme.id)}
            className={`cursor-pointer ${
              customTheme === theme.id ? "bg-primary/10 font-semibold" : ""
            }`}
          >
            <span className="mr-2 text-lg">{theme.icon}</span>
            {theme.name}
            {customTheme === theme.id && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
