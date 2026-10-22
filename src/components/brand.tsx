import Link from "next/link";
import { Layers } from "lucide-react";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "light" : ""}`}
      aria-label="SIPRIMA beranda"
    >
      <span className="brand-icon">
        <Layers size={25} strokeWidth={1.8} />
      </span>
      <span>
        <strong>
          SIPRIMA<span className="brand-dot">.</span>
        </strong>
        <small>RISET & MAGANG</small>
      </span>
    </Link>
  );
}
