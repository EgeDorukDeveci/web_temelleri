import type { Tutorial } from "@/content/types";
import modernWebTutorial from "@/content/tutorials/modern-web.json";

export const tutorial = modernWebTutorial as Tutorial;
export const lessons = tutorial.lessons;
