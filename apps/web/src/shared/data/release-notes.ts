import { APP_VERSION } from "@/version";

export type ReleaseHighlight = {
  title: string;
  description: string;
};

export type ReleaseNote = {
  version: string;
  releasedAt: string;
  title: string;
  summary: string;
  highlights: ReleaseHighlight[];
};

export const releaseNotes: ReleaseNote[] = [
  {
    version: "0.1.3",
    releasedAt: "17 August 2026",
    title: "More reliable operations and delivery completion",
    summary:
      "This update improves daily use on slow connections and completes key delivery workflows.",
    highlights: [
      {
        title: "Connection resilience",
        description:
          "Requests now recover more reliably on slow or unstable networks, with clearer guidance when an action cannot be completed.",
      },
      {
        title: "Login feedback",
        description:
          "Sign-in limits now show a synchronized countdown instead of a technical error, so users know when they can try again.",
      },
      {
        title: "Border progress",
        description:
          "Border events stay synchronized with trip status, Activities, and the tracking page shared with clients.",
      },
      {
        title: "POD and container return",
        description:
          "After discharge, users can attach and view the POD directly from Activities and record container returns when required.",
      },
      {
        title: "PDF exports",
        description:
          "Operational PDF layouts now keep headings, special characters, and footer text inside the page margins.",
      },
    ],
  },
];

export const currentReleaseNote =
  releaseNotes.find((release) => release.version === APP_VERSION) ?? null;
