import { useMemo } from "react";
import { motion } from "framer-motion";

type Point = [number, number];

const NARROW = 92;
const TAB_RX = 100 - NARROW;
const BLANK_RX = 8;
const TAB_RY = 8;
const CURVE_N = 12;

const NOTCH_RX = 3.5;
const NOTCH_RY = 2.5;
const NOTCH_N = 8;

function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  n: number,
): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const θ = from + (to - from) * (i / (n - 1));
    return [
      Math.round((cx + rx * Math.cos(θ)) * 10) / 10,
      Math.round((cy + ry * Math.sin(θ)) * 10) / 10,
    ] as Point;
  });
}

function flat(x: number, ys: number[]): Point[] {
  return ys.map((y) => [x, y] as Point);
}

const topNotch = arc(50, 0, NOTCH_RX, NOTCH_RY, Math.PI, 0, NOTCH_N);
const bottomNotch = arc(
  50,
  100,
  NOTCH_RX,
  -NOTCH_RY,
  0,
  Math.PI,
  NOTCH_N,
);

function poly(rightEdge: number, tab: Point[], blank: Point[]): string {
  const pts: Point[] = [
    [0, 0],
    ...topNotch,
    [rightEdge, 0],
    ...tab,
    [rightEdge, 100],
    ...bottomNotch,
    [0, 100],
    ...blank,
  ];
  return `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
}

interface Props {
  step: string;
  title: string;
  description: string;
  tag: string;
  gradient: string;
  dotColor: string;
  glow: string;
  tabCY: number;
  blankCY: number;
  showTab: boolean;
  showBlank: boolean;
  isHovered: boolean;
  isNeighbor: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export default function PuzzlePieceCard({
  step,
  title,
  description,
  tag,
  gradient,
  dotColor,
  glow,
  tabCY,
  blankCY,
  showTab,
  showBlank,
  isHovered,
  isNeighbor,
  onHoverStart,
  onHoverEnd,
}: Props) {
  const arcs = useMemo(() => {
    const tabA = arc(
      NARROW,
      tabCY,
      TAB_RX,
      TAB_RY,
      -Math.PI / 2,
      Math.PI / 2,
      CURVE_N,
    );
    const blankA = arc(
      0,
      blankCY,
      BLANK_RX,
      TAB_RY,
      Math.PI / 2,
      -Math.PI / 2,
      CURVE_N,
    );
    const tYs = tabA.map(([, y]) => y);
    const bYs = blankA.map(([, y]) => y);
    const rect = poly(100, flat(100, tYs), flat(0, bYs));
    return { tabA, blankA, tYs, bYs, rect };
  }, [tabCY, blankCY]);

  const clipPath = useMemo(() => {
    const { tabA, blankA, tYs, bYs, rect } = arcs;
    if (!showTab && !showBlank) return rect;
    const rightEdge = showTab ? NARROW : 100;
    const tab = showTab ? tabA : flat(100, tYs);
    const blank = showBlank ? blankA : flat(0, bYs);
    return poly(rightEdge, tab, blank);
  }, [showTab, showBlank, arcs]);

  return (
    <motion.div
      className="relative w-[260px] h-[320px] cursor-pointer select-none bg-white"
      initial={{
        clipPath: arcs.rect,
        scale: 1,
        filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.3))",
      }}
      animate={{
        clipPath,
        scale: isHovered ? 1.04 : 1,
        filter: isHovered
          ? `drop-shadow(0 28px 60px ${glow})`
          : isNeighbor
            ? "drop-shadow(0 8px 30px rgba(0,0,0,0.35))"
            : "drop-shadow(0 4px 24px rgba(0,0,0,0.3))",
      }}
      transition={{
        clipPath: {
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: isNeighbor ? 0.06 : 0,
        },
        scale: { type: "spring", stiffness: 260, damping: 20 },
        filter: { duration: 0.4 },
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="h-full flex flex-col px-7 pt-9 pb-5">
        <div className="flex-1">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400 mb-0.5">
            Step
          </p>
          <p
            className={`text-[32px] font-black font-mono leading-none mb-5 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}
          >
            {step}
          </p>

          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400 mb-1">
            Phase
          </p>
          <h2 className="text-[17px] font-bold text-slate-900 uppercase tracking-wide mb-3">
            {title}
          </h2>

          <p className="text-[12px] text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="border-t border-dashed border-slate-200 mb-4" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span className="text-[11px] font-medium text-slate-500">
              {tag}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-300">{step}</span>
        </div>
      </div>
    </motion.div>
  );
}
