import { lazy } from "react";
import type { LabGame } from "./types";

export const labGames: LabGame[] = [
  { id: "subnetting", title: "Subnetting Sprint", tagline: "Read the boundaries. Find the right address.", track: "CCNA", minutes: 2, component: lazy(() => import("./games/subnetting")) },
  { id: "vpc", title: "Build a VPC", tagline: "Wire an AWS network until the traffic flows.", track: "AWS", minutes: 3, component: lazy(() => import("./games/vpc")) },
];
