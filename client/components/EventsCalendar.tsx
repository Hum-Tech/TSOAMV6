import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  type: string;
  category: string;
  location: string;
  organizer: string;
  expectedAttendees: number;
  status: string;
  recurring: string;
}

interface EventsCalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

export function EventsCalendar({ events, onEventClick }: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Worship: "bg-blue-100 text-blue-800",
      Education: "bg-green-100 text-green-800",
      Fellowship: "bg-purple-100 text-purple-800",
      Outreach: "bg-orange-100 text-orange-800",
      Administrative: "bg-gray-100 text-gray-800",
      "Special Occasion": "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: string) => {
    return events.filter((event) => event.date === date);
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Create calendar grid
  const calendarDays = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">
          {monthNames[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-500 border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={index}
                className="h-24 border-r border-b last:border-r-0"
              ></div>
            );
          }

          const dateString = formatDate(year, month, day);
          const dayEvents = getEventsForDate(dateString);
          const isTodayFlag = isToday(year, month, day);

          return (
            <div
              key={index}
              className={`h-24 border-r border-b last:border-r-0 p-1 overflow-hidden ${
                isTodayFlag ? "bg-blue-50" : ""
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isTodayFlag ? "text-blue-600" : "text-gray-900"
                }`}
              >
                {day}
                {isTodayFlag && (
                  <span className="ml-1 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(event.category)}`}
                    onClick={() => onEventClick?.(event)}
                    title={`${event.title} - ${event.time} at ${event.location}`}
                  >
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="truncate opacity-75 text-[10px]">
                      {event.time} • {event.location}
                    </div>
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <div
                    className="text-xs text-gray-500 font-medium cursor-pointer hover:text-gray-700"
                    title={`View all ${dayEvents.length} events for this day`}
                  >
                    +{dayEvents.length - 3} more events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Event Categories</h4>
        <div className="flex flex-wrap gap-2">
          {[
            "Worship",
            "Education",
            "Fellowship",
            "Outreach",
            "Administrative",
            "Special Occasion",
          ].map((category) => (
            <Badge
              key={category}
              className={`text-xs ${getCategoryColor(category)}`}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventsCalendar;
