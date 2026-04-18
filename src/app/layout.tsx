import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Flyin | Drone Map Visualizer",
    template: "%s | Flyin",
  },
  applicationName: "Flyin",
  description:
    "Flyin is a modern drone-map visualizer for 42 Network students. Paste map configs, validate metadata, and explore routes interactively.",
  keywords: [
    "Flyin",
    "42 Network",
    "drone map",
    "graph visualizer",
    "pathfinding",
    "Next.js",
    "TypeScript",
    "SVG",
  ],
  authors: [{ name: "sohrich", url: "https://profile-v3.intra.42.fr/users/soahrich" }],
  creator: "sohrich",
  publisher: "42 Network",
  category: "education",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Flyin | Drone Map Visualizer",
    description:
      "Parse drone map configs and visualize hubs, zones, and links with an interactive SVG map.",
    type: "website",
    siteName: "Flyin",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flyin | Drone Map Visualizer",
    description:
      "Interactive drone map parser and visualizer for learning graph pathfinding.",
    creator: "@sohrich",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
