import type { Metadata } from "next";
import DroneMapVisualizer from "@/components/drone-map-visualizer";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://flyin-drone-map-visualizer.vercel.app/";

export const metadata: Metadata = {
  title: "Fly_in Visualizer",
  description:
    "Explore drone routes, validate map syntax, and simulate drone movement on an interactive SVG map.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Flyin | Fly_in Visualizer",
    description:
      "Explore drone routes, validate map syntax, and simulate drone movement on an interactive SVG map.",
    url: siteUrl,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flyin | Fly_in Visualizer",
    description:
      "Explore drone routes, validate map syntax, and simulate drone movement on an interactive SVG map.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <DroneMapVisualizer />;
}
