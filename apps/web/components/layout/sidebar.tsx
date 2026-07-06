import Image from "next/image";
import { NavigationList } from "@/components/navigation/navigation-list";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-brand-100 bg-white lg:flex dark:border-brand-950 dark:bg-slate-950">
      <div className="flex items-center border-b border-brand-100 px-6 py-5 dark:border-brand-950">
        <span className="grid h-16 w-full max-w-52 place-items-center overflow-hidden rounded-md bg-white px-3 shadow-sm ring-1 ring-brand-100">
          <Image
            src="/lumac-logo.png"
            alt=""
            width={132}
            height={43}
            className="h-12 w-full object-contain"
            priority
          />
        </span>
        <span className="sr-only">LUMAC Transportes & Logística</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <NavigationList />
      </div>
      <div className="border-t border-brand-100 px-6 py-4 dark:border-brand-950">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} LUMAC · v1.0
        </p>
      </div>
    </aside>
  );
}
