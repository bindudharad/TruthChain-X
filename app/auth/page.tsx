import { Suspense } from "react";
import { AuthExperience } from "@/components/features/identity/AuthExperience";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthExperience />
    </Suspense>
  );
}
