import WeatherWidget from "@/components/widgets/WeatherWidget";
import NotesWidget from "@/components/widgets/NotesWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import ClockWidget from "@/components/widgets/ClockWidget";
import CalculatorWidget from "@/components/widgets/CalculatorWidget";

// Snap grid: 20px cells.
export const GRID = 20;

// Each widget: default size (in cells), min/max size (cells), and component.
export const WIDGET_DEFS = [
  {
    id: "weather",
    name: "Weather",
    defaultSize: { w: 10, h: 8 },
    minSize: { w: 8, h: 6 },
    maxSize: { w: 16, h: 12 },
    Component: WeatherWidget,
  },
  {
    id: "notes",
    name: "Sticky Notes",
    defaultSize: { w: 10, h: 10 },
    minSize: { w: 8, h: 6 },
    maxSize: { w: 18, h: 18 },
    Component: NotesWidget,
  },
  {
    id: "calendar",
    name: "Calendar",
    defaultSize: { w: 10, h: 10 },
    minSize: { w: 8, h: 8 },
    maxSize: { w: 14, h: 12 },
    Component: CalendarWidget,
  },
  {
    id: "clock",
    name: "Clock",
    defaultSize: { w: 10, h: 10 },
    minSize: { w: 8, h: 8 },
    maxSize: { w: 16, h: 16 },
    Component: ClockWidget,
    requiresPick: "clockStyle",
  },
  {
    id: "calculator",
    name: "Calculator",
    defaultSize: { w: 10, h: 14 },
    minSize: { w: 10, h: 14 },
    maxSize: { w: 18, h: 24 },
    Component: CalculatorWidget,
  },
];

export function getWidgetDef(id) {
  return WIDGET_DEFS.find((w) => w.id === id);
}
