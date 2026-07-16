"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/Container.png", alt: "Transporte de carga em contentor", label: "Contentores" },
  { src: "/Carga Geral.png", alt: "Transporte de carga geral", label: "Carga geral" },
  { src: "/Granel.png", alt: "Transporte de carga a granel", label: "Carga a granel" },
];

export function LoginCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      50_000,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="relative hidden min-h-screen overflow-hidden bg-slate-950 lg:block"
      aria-label="Serviços de transporte da LUMAC"
    >
      {slides.map((slide, index) => (
        <figure
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === active ? "z-10 opacity-100" : "z-0 opacity-0"}`}
          aria-hidden={index !== active}
        >
          <Image
            src={slide.src}
            alt={index === active ? slide.alt : ""}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 65vw, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/5 to-slate-950/10" />
        </figure>
      ))}

      <div className="absolute inset-x-10 bottom-10 z-20 flex items-end justify-between gap-6">
        <div className="max-w-md text-white">
          <p className="text-xl font-semibold">Logística que acompanha cada carga.</p>
          <p className="mt-1.5 text-sm text-white/75">Operação, acompanhamento e entrega num só lugar.</p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/45 p-2 backdrop-blur-md" role="tablist" aria-label="Selecionar tipo de carga">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={slide.label}
              onClick={() => setActive(index)}
              className={`h-2 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2 bg-white/45 hover:bg-white/75"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
