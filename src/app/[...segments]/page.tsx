import { Portal } from "@/components/portal";
import { Suspense } from "react";
import { Loading } from "@/components/ui";
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Portal />
    </Suspense>
  );
}
