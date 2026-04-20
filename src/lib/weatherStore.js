// Shared weather city store, so the Weather widget reflects the city set in the Weather app.
import { useEffect, useState } from "react";

let _city = "San Francisco";
const _listeners = new Set();

export function getWeatherCity() { return _city; }
export function setWeatherCity(city) {
  _city = city;
  for (const fn of _listeners) fn(_city);
}

export function useWeatherCity() {
  const [city, set] = useState(_city);
  useEffect(() => {
    const fn = (c) => set(c);
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);
  return city;
}
