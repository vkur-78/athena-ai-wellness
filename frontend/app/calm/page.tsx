"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalmPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/studio");
  }, [router]);

  return null;
}
