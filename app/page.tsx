import type { Metadata } from "next";
import MapExplorer from "./MapExplorer";

export const metadata: Metadata = {
  title: "Manhattan ACE Violation Explorer",
  description: "Explore all Manhattan Automated Camera Enforcement records by outcome, route, stop, and neighborhood.",
};

export default function Home() {
  return <MapExplorer />;
}
