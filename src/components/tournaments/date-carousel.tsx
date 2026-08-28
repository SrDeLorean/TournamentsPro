'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { GameConfig } from '@/lib/games-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export interface CalendarDayItem {
  dateStr: string;
  label: string;
  dayName: string;
  dayDDMM: string;
  dayNumber: number;
  count: number;
}

interface DateCarouselProps {
  game: GameConfig;
  calendarDays: CalendarDayItem[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

export function DateCarousel({
  game,
  calendarDays,
  selectedDate,
  onSelectDate,
}: DateCarouselProps) {
  const brandColor = game?.brandColor || '#FF4654';
  const carouselRef = useRef<HTMLDivElement>(null);

  // 1-by-1 item scroll helper (148px per card + gap)
  const scrollCarousel = useCallback((direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -148 : 148;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  const handlePrevDate = () => {
    const currIdx = calendarDays.findIndex((d) => d.dateStr === selectedDate);
    if (currIdx > 0) {
      onSelectDate(calendarDays[currIdx - 1].dateStr);
    }
    scrollCarousel('left');
  };

  const handleNextDate = () => {
    const currIdx = calendarDays.findIndex((d) => d.dateStr === selectedDate);
    if (currIdx >= 0 && currIdx < calendarDays.length - 1) {
      onSelectDate(calendarDays[currIdx + 1].dateStr);
    }
    scrollCarousel('right');
  };

  // Auto-scroll selected date into view & center it
  useEffect(() => {
    if (selectedDate && carouselRef.current) {
      const idx = calendarDays.findIndex((d) => d.dateStr === selectedDate);
      if (idx >= 0) {
        const itemWidth = 148;
        const containerWidth = carouselRef.current.clientWidth || 600;
        const targetScroll = idx * itemWidth - (containerWidth / 2 - itemWidth / 2);
        carouselRef.current.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      }
    }
  }, [selectedDate, calendarDays]);

  if (calendarDays.length === 0) return null;

  const currentIdx = calendarDays.findIndex((d) => d.dateStr === selectedDate);

  return (
    <div className="game-calendar-panel space-y-4 bg-[var(--bg-card)] p-4 sm:p-5 rounded-3xl border border-[var(--border-card)] shadow-xl text-center font-mono backdrop-blur-md">
      {/* Header centered */}
      <div className="game-calendar-heading flex items-center justify-between gap-3 text-left">
        <div className="flex min-w-0 items-center gap-2">
        <Calendar className="w-5 h-5 shrink-0" style={{ color: brandColor }} />
        <span className="text-xs sm:text-sm font-mono font-black text-[var(--text-heading)] uppercase tracking-wider">
          FECHAS DISPONIBLES EN CALENDARIO
        </span></div>
        <Badge variant="cyan" className="text-[10px] font-mono font-bold px-2.5 py-0.5">
          {calendarDays.length} FECHAS
        </Badge>
      </div>

      {/* Side-by-side layout: < Button [ Date Carousel ] > Button */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        {/* Left Arrow Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevDate}
          disabled={currentIdx <= 0}
          className="p-2 sm:p-3 rounded-2xl border-2 border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:border-cyan-400 disabled:opacity-20 disabled:pointer-events-none shrink-0 shadow-lg"
          title="Anterior Fecha"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Interactive Scrollable Carousel container for dates — WITH VISIBLE BOTTOM SCROLLBAR */}
        <div
          ref={carouselRef}
          data-date-carousel
          className="game-calendar-track flex items-center justify-start gap-2.5 overflow-x-auto scroll-smooth py-2 pb-3 flex-1 px-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${brandColor}90 var(--bg-main)`,
          }}
        >
          {calendarDays.map((day) => {
            const isActive = selectedDate === day.dateStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => onSelectDate(day.dateStr)}
                aria-pressed={isActive}
                aria-label={`${day.label}, ${day.count} partidos`}
                className={`game-calendar-day flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center min-w-[124px] shrink-0 relative overflow-hidden group ${
                  isActive
                    ? 'game-calendar-day-active font-black'
                    : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-primary)] hover:border-cyan-400/60 hover:bg-[var(--bg-card-hover)]'
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${brandColor}, #111827)`,
                        borderColor: brandColor,
                        boxShadow: `0 12px 28px -16px ${brandColor}`,
                        color: 'var(--game-on-brand)',
                      }
                    : {}
                }
              >
                <span
                  className={`text-[11px] font-mono uppercase font-black tracking-wider ${
                    isActive ? 'text-white' : 'text-cyan-400'
                  }`}
                >
                  {day.dayName}
                </span>
                <span className={`text-2xl font-black font-mono my-0.5 tracking-tight ${isActive ? 'text-white' : 'text-[var(--text-heading)]'}`}>
                  {day.dayDDMM}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold py-0.5 px-2.5 rounded-full uppercase mt-1 transition-colors ${
                    isActive
                      ? 'bg-slate-950 text-cyan-300 border border-slate-950 font-black'
                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {day.count} PARTIDO{day.count !== 1 ? 'S' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextDate}
          disabled={currentIdx >= calendarDays.length - 1}
          className="p-2 sm:p-3 rounded-2xl border-2 border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:border-cyan-400 disabled:opacity-20 disabled:pointer-events-none shrink-0 shadow-lg"
          title="Siguiente Fecha"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
