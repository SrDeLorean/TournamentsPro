'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { GameConfig } from '@/lib/games-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const brandColor = game?.brandColor || 'var(--app-accent)';
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
    <div className="space-y-4 bg-[var(--bg-card)] p-4 sm:p-5 rounded-3xl border border-[var(--border-card)] shadow-xl text-center backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 text-left">
        <div className="flex min-w-0 items-center gap-2">
          <Calendar className="w-5 h-5 shrink-0 text-[var(--app-accent)]" />
          <span className="text-xs sm:text-sm font-black text-[var(--text-heading)] uppercase tracking-wider">
            Fechas Disponibles en Calendario
          </span>
        </div>
        <Badge variant="cyan" is3D className="text-[10px] font-bold px-2.5 py-0.5">
          {calendarDays.length} Fechas
        </Badge>
      </div>

      {/* Side-by-side layout: < Button [ Date Carousel ] > Button */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        {/* Left Arrow Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevDate}
          disabled={currentIdx <= 0}
          className="rounded-2xl border border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--app-accent)] disabled:opacity-20 disabled:pointer-events-none shrink-0 shadow-sm size-11"
          title="Anterior Fecha"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Interactive Scrollable Carousel container for dates */}
        <div
          ref={carouselRef}
          data-date-carousel
          className="flex items-center justify-start gap-2.5 overflow-x-auto scroll-smooth py-2 pb-3 flex-1 px-1 no-scrollbar"
        >
          {calendarDays.map((day) => {
            const isActive = selectedDate === day.dateStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => onSelectDate(day.dateStr)}
                aria-pressed={isActive}
                aria-label={`${day.label}, ${day.count} partidos`}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center min-w-[124px] shrink-0 relative overflow-hidden group cursor-pointer',
                  isActive
                    ? 'shadow-lg'
                    : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-primary)] hover:border-[var(--app-accent)] hover:bg-[var(--bg-card-hover)]'
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--app-accent)',
                        borderColor: 'var(--app-accent)',
                        color: 'var(--accent-contrast)',
                        boxShadow: '0 8px 24px -8px var(--app-accent)',
                      }
                    : {}
                }
              >
                <span
                  className={cn(
                    'text-[11px] uppercase font-extrabold tracking-wider',
                    isActive ? 'text-[var(--text-heading)]' : 'text-[var(--app-accent)]'
                  )}
                >
                  {day.dayName}
                </span>
                <span
                  className={cn(
                    'text-2xl font-black my-0.5 tracking-tight font-[family-name:var(--font-active)]',
                    isActive ? 'text-[var(--text-heading)]' : 'text-[var(--text-heading)]'
                  )}
                >
                  {day.dayDDMM}
                </span>
                <span
                  className={cn(
                    'text-[9px] font-bold py-0.5 px-2.5 rounded-full uppercase mt-1 transition-colors font-[family-name:var(--font-active)]',
                    isActive
                      ? 'bg-[var(--app-overlay)] text-[var(--text-heading)] border border-[var(--border-card)]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-card)]'
                  )}
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
          size="icon"
          onClick={handleNextDate}
          disabled={currentIdx >= calendarDays.length - 1}
          className="rounded-2xl border border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--app-accent)] disabled:opacity-20 disabled:pointer-events-none shrink-0 shadow-sm size-11"
          title="Siguiente Fecha"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
