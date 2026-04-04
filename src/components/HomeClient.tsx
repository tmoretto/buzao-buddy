"use client";

import { useEffect, useState } from "react";
import { NearbyStops } from "./NearbyStops";

export function HomeClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="h-full flex flex-col">
      {mounted ? <NearbyStops /> : null}
    </main>
  );
}