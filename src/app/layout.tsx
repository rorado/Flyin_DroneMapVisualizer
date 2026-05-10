import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://flyin-drone-map-visualizer.vercel.app/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Flyin | Drone Map Visualizer",
    template: "%s | Flyin",
  },
  applicationName: "Flyin",
  description:
    "Flyin is a drone map visualizer for 42 Network students. Paste map configs, validate zones, and explore routes interactively.",
  keywords: [
    "Flyin",
    "Flyin visualizer",
    "42 Network",
    "fly_in 42 project",
    "42 project",
    "fly_in",
    "drone map visualizer",
    "graph visualizer",
    "pathfinding",
    "Next.js",
  ],
  authors: [
    { name: "sohrich", url: "https://profile-v3.intra.42.fr/users/soahrich" },
  ],
  creator: "sohrich",
  publisher: "42 Network",
  category: "education",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "theme-color": "#020617",
    "color-scheme": "dark",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Flyin | Drone Map Visualizer",
    description:
      "Parse drone map configs and visualize hubs, zones, and links with an interactive SVG map.",
    type: "website",
    siteName: "Flyin",
    url: siteUrl,
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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
