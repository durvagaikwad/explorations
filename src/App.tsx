import { useState } from "react";
import PuzzlePieceCard from "./components/PuzzlePieceCard";

// Vertical positions where adjacent cards interlock — each is unique
const joints = [38, 58, 43];

const cards = [
  {
    step: "01",
    title: "Design",
    description:
      "Map out your vision and define the blueprint for what comes next.",
    tag: "Discovery",
    gradient: "from-violet-500 to-fuchsia-500",
    dotColor: "bg-violet-500",
    glow: "rgba(139, 92, 246, 0.45)",
    blankCY: 50,
    tabCY: joints[0],
    hasBlank: false,
    hasTab: true,
  },
  {
    step: "02",
    title: "Develop",
    description: "Transform ideas into reality with clean, efficient code.",
    tag: "Engineering",
    gradient: "from-sky-500 to-blue-500",
    dotColor: "bg-sky-500",
    glow: "rgba(56, 189, 248, 0.45)",
    blankCY: joints[0],
    tabCY: joints[1],
    hasBlank: true,
    hasTab: true,
  },
  {
    step: "03",
    title: "Test",
    description:
      "Verify every edge case before anything reaches production.",
    tag: "Quality",
    gradient: "from-emerald-500 to-teal-500",
    dotColor: "bg-emerald-500",
    glow: "rgba(52, 211, 153, 0.45)",
    blankCY: joints[1],
    tabCY: joints[2],
    hasBlank: true,
    hasTab: true,
  },
  {
    step: "04",
    title: "Deploy",
    description: "Ship with confidence and deliver value to your users.",
    tag: "Release",
    gradient: "from-amber-500 to-orange-500",
    dotColor: "bg-amber-500",
    glow: "rgba(251, 191, 36, 0.4)",
    blankCY: joints[2],
    tabCY: 50,
    hasBlank: true,
    hasTab: false,
  },
];

export default function App() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden"
      style={{ background: "#0f0f1a" }}
    >
      <div className="absolute top-[20%] -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] bg-[#8b5cf6] pointer-events-none" />
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-[0.04] blur-[120px] bg-[#38bdf8] pointer-events-none" />
      <div className="absolute bottom-[20%] -right-40 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] bg-[#34d399] pointer-events-none" />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">
        <div className="flex gap-1.5">
          {cards.map((card, i) => {
            const isHovered = hoveredIndex === i;
            const leftHovered = hoveredIndex === i - 1;
            const rightHovered = hoveredIndex === i + 1;

            return (
              <PuzzlePieceCard
                key={card.step}
                {...card}
                showTab={card.hasTab && (isHovered || rightHovered)}
                showBlank={card.hasBlank && (isHovered || leftHovered)}
                isHovered={isHovered}
                isNeighbor={!isHovered && (leftHovered || rightHovered)}
                onHoverStart={() => setHoveredIndex(i)}
                onHoverEnd={() => setHoveredIndex(null)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
