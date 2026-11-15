import type { Slot, Venue } from "./types";

// Small hardcoded list of Austin spots, tagged by vibe. Public places and districts, not endorsements.
export const VENUES: (Venue & { slots: Slot[] })[] = [
  { name: "Rooftop happy hour", area: "Congress Ave, Downtown", activity: "Rooftop drinks overlooking the Capitol", vibe: { career: 0.8, nightlife: 0.7 }, slots: ["thu-evening", "fri-evening"] },
  { name: "Rainey Street", area: "Rainey Street", activity: "Bungalow-bar hop on Rainey Street", vibe: { nightlife: 0.9, creative: 0.2 }, slots: ["fri-evening", "sat-evening"] },
  { name: "Mount Bonnell", area: "West Austin", activity: "Sunset hike up Mount Bonnell, then tacos and live music on the East Side", vibe: { outdoors: 0.9, creative: 0.7 }, slots: ["sat-day", "sun-day"] },
  { name: "Lady Bird Lake", area: "Zilker", activity: "Paddleboarding on Lady Bird Lake, then a picnic at Zilker", vibe: { outdoors: 0.9, nightlife: 0.1 }, slots: ["sat-day", "sun-day"] },
  { name: "Red River", area: "Red River Cultural District", activity: "Live music night in the Red River district", vibe: { creative: 0.9, nightlife: 0.6 }, slots: ["thu-evening", "fri-evening", "sat-evening"] },
  { name: "Hyde Park trivia", area: "Hyde Park", activity: "Pub trivia and pizza in Hyde Park", vibe: { bookish: 0.9, career: 0.3 }, slots: ["thu-evening", "sun-day"] },
];

export const SLOT_LABELS: Record<Slot, string> = {
  "thu-evening": "Thursday, 7:00 PM",
  "fri-evening": "Friday, 7:30 PM",
  "sat-day": "Saturday, 4:30 PM",
  "sat-evening": "Saturday, 7:00 PM",
  "sun-day": "Sunday, 11:00 AM",
};
