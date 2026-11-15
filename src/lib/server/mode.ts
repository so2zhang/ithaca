// DEMO_MODE=mock swaps every paid/network call for recorded fixtures (see CLAUDE.md, Test seams).
export const isMock = () => process.env.DEMO_MODE === "mock";
