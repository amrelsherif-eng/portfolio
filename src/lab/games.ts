import { lazy } from "react";
import type { LabGame } from "./types";

export const labGames: LabGame[] = [
  { id: "subnetting", title: "Subnetting Sprint", tagline: "Read the boundaries. Find the right address.", track: "CCNA", minutes: 2, component: lazy(() => import("./games/subnetting")) },
];
