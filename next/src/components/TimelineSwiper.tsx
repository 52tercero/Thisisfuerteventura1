"use client";
import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode, Parallax } from "swiper/modules";
import "swiper/css";

type Item = { title?: string; image?: string; date?: string; link?: string; source?: string };

export default function TimelineSwiper({ items = [] as Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return; try { void window.getComputedStyle(el); } catch(_) {}
  }, []);
  if (!items || items.length === 0) return null;
  return (
    <div ref={ref} className="mt-6">
      <Swiper
        modules={[Autoplay, FreeMode, Parallax]}
        slidesPerView={"auto"}
        spaceBetween={12}
        freeMode
        loop
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        breakpoints={{ 768: { spaceBetween: 16 }, 1024: { spaceBetween: 20 } }}
      >
        {items.map((n, i) => (
          <SwiperSlide key={i} className="!w-auto">
            <div className="px-3 py-2 rounded bg-gray-100 text-gray-800 whitespace-nowrap">
              {(n.date ? n.date + " · " : "") + (n.title || "Noticia")}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
