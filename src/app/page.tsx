import { connection } from "next/server";
import { BeeLoopApp } from "@/components/BeeLoopApp";

export default async function Page() {
  await connection(); // read DEMO_MODE at request time, not build time
  return <BeeLoopApp mode={process.env.DEMO_MODE === "mock" ? "mock" : "live"} />;
}
