import WeatherWidget from "@/components/widgets/WeatherWidget";
import NotesWidget from "@/components/widgets/NotesWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import ClockWidget from "@/components/widgets/ClockWidget";
import CalculatorWidget from "@/components/widgets/CalculatorWidget";

// Snap grid: 40px cells. Sizes are expressed in cells (cellW x cellH).
export const GRID = 40;

// Each widget: default size (in cells), min/max size (cells), and component.
export const WIDGET_DEFS = [
  {
    id: "weather",
    name: "Weather",
    defaultSize: { w: 5, h: 4 },        // 200x160
    minSize: { w: 4, h: 3 },             // 160x120
    maxSize: { w: 8, h: 6 },             // 320x240
    Component: WeatherWidget,
  },
  {
    id: "notes",
    name: "Sticky Notes",
    defaultSize: { w: 5, h: 5 },         // 200x200
    minSize: { w: 4, h: 3 },
    maxSize: { w: 9, h: 9 },
    Component: NotesWidget,
  },
  {
    id: "calendar",
    name: "Calendar",
    defaultSize: { w: 5, h: 5 },
    minSize: { w: 4, h: 4 },
    maxSize: { w: 7, h: 6 },
    Component: CalendarWidget,
  },
  {
    id: "clock",
    name: "Clock",
    defaultSize: { w: 5, h: 5 },
    minSize: { w: 4, h: 4 },
    maxSize: { w: 8, h: 8 },
    Component: ClockWidget,
    requiresPick: "clockStyle", // picker shows secondary style choice
  },
  {
    id: "calculator",
    name: "Calculator",
    defaultSize: { w: 5, h: 7 },        // ~ 2 wide x 1 tall in 40px? user said default 2:1, get bigger
    minSize: { w: 5, h: 7 },             // can't shrink below this so buttons fit
    maxSize: { w: 9, h: 12 },
    Component: CalculatorWidget,
  },
];

export function getWidgetDef(id) {
  return WIDGET_DEFS.find((w) => w.id === id);
}
