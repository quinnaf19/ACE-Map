import type { Metadata } from "next";
import MapExplorer from "./MapExplorer";

export const metadata: Metadata = {
  title: "Manhattan ACE Violation Explorer",
  description: "Explore issued New York City Automated Camera Enforcement violations by route, stop, and neighborhood.",
};

export default function Home() {
  return <MapExplorer />;
}
