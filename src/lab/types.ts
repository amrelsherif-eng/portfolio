import type React from "react";

export type GameProps = { onFinish: (result: { score: number; max: number; seconds: number }) => void };
export type LabGame = {
  id: string;
  title: string;
  tagline: string;
  track: "CCNA" | "Linux" | "AWS" | "DevOps";
  minutes: number;
  component: React.LazyExoticComponent<React.ComponentType<GameProps>>;
};
