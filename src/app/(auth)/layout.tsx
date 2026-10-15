import { BrandImage, BrandText } from "@/components/brand/brand-hero";
import { CosmosSky } from "@/components/brand/cosmos";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <CosmosSky className="min-h-dvh">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 px-4 py-8">
        <div className="-mb-4">
          <BrandImage blend className="cosmos-float" />
        </div>
        <BrandText />
        {children}
      </main>
    </CosmosSky>
  );
}
