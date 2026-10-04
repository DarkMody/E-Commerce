import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "ap-pin",
  html: "<span></span>",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function AddressPicker({ onSelect }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const timer = useRef(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [locating, setLocating] = useState(false);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      setQuery(data.display_name || "");
      onSelect({ lat, lng, formattedAddress: data.display_name });
    } catch {
      onSelect({
        lat,
        lng,
        formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      });
    }
  };

  useEffect(() => {
    const start = [30.0131, 31.2089];
    const map = L.map(mapEl.current, { zoomControl: false }).setView(start, 15);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker(start, { draggable: true, icon: pinIcon }).addTo(
      map,
    );
    markerRef.current = marker;

    marker.on("dragend", () => {
      const p = marker.getLatLng();
      reverseGeocode(p.lat, p.lng);
    });
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => map.invalidateSize(), 0);
    return () => map.remove();
  }, []);

  // Debounced so we stay inside Nominatim's usage limits
  const onType = (text) => {
    setQuery(text);
    clearTimeout(timer.current);
    if (text.trim().length < 3) return setSuggestions([]);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(text)}`,
        );
        setSuggestions(await res.json());
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const pick = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    mapRef.current.setView([lat, lng], 16);
    markerRef.current.setLatLng([lat, lng]);
    setQuery(place.display_name);
    setSuggestions([]);
    onSelect({ lat, lng, formattedAddress: place.display_name });
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current.setView([coords.latitude, coords.longitude], 17);
        markerRef.current.setLatLng([coords.latitude, coords.longitude]);
        reverseGeocode(coords.latitude, coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  return (
    <div className="ap">
      <div className="ap-search">
        <input
          type="text"
          value={query}
          onChange={(e) => onType(e.target.value)}
          placeholder="Search your street or area"
          aria-label="Search address"
        />
        <button type="button" onClick={locateMe} disabled={locating}>
          {locating ? "Locating…" : "Use my location"}
        </button>
        {suggestions.length > 0 && (
          <ul>
            {suggestions.map((s) => (
              <li key={s.place_id} onClick={() => pick(s)}>
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div ref={mapEl} className="ap-map" />
    </div>
  );
}

export default AddressPicker;
