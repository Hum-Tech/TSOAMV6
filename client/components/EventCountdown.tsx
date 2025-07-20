import { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

interface CountdownProps {
  eventDate: string;
  eventTime: string;
  eventTitle: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function EventCountdown({
  eventDate,
  eventTime,
  eventTitle,
  className = "",
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const eventDateTime = new Date(`${eventDate}T${eventTime}`);
      const now = new Date();
      const difference = eventDateTime.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate, eventTime]);

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Event has passed</span>
      </div>
    );
  }

  const hasStarted =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (hasStarted) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-medium">Event is happening now!</span>
      </div>
    );
  }

  const formatTime = (value: number) => value.toString().padStart(2, "0");

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          Countdown to {eventTitle}
        </span>
      </div>

      {/* Live Countdown Display */}
      <div className="flex items-center justify-center">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center gap-1 text-lg font-mono font-bold text-primary">
            <span className="bg-primary text-white px-2 py-1 rounded min-w-[32px] text-center">
              {formatTime(timeLeft.days)}
            </span>
            <span className="text-primary/60">:</span>
            <span className="bg-primary text-white px-2 py-1 rounded min-w-[32px] text-center">
              {formatTime(timeLeft.hours)}
            </span>
            <span className="text-primary/60">:</span>
            <span className="bg-primary text-white px-2 py-1 rounded min-w-[32px] text-center">
              {formatTime(timeLeft.minutes)}
            </span>
            <span className="text-primary/60">:</span>
            <span className="bg-primary text-white px-2 py-1 rounded min-w-[32px] text-center">
              {formatTime(timeLeft.seconds)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 px-1">
            <span>Days</span>
            <span>Hours</span>
            <span>Minutes</span>
            <span>Seconds</span>
          </div>
        </div>
      </div>

      {timeLeft.days === 0 && timeLeft.hours < 24 && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Event starts today!
          </span>
        </div>
      )}
    </div>
  );
}

export default EventCountdown;
