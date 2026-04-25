import { Suspense } from "react";
import { AuthExperience } from "@/components/features/identity/AuthExperience";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthExperience />
    </Suspense>
  );
}
