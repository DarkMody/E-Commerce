import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon paths (Leaflet + bundlers issue)
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: icon, shadowUrl: iconShadow });

function AddressPicker({ onSelect }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const defaultPos = [30.0131, 31.2089]; // Giza as a fallback center

    const map = L.map(mapContainerRef.current).setView(defaultPos, 15);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker(defaultPos, { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    return () => map.remove();
  }, []);

  // Free reverse geocoding (coords -> address) via Nominatim
  const reverseGeocode = async (lat, lng) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    );
    const data = await res.json();
    onSelect({ lat, lng, formattedAddress: data.display_name });
  };

  // Free address search (text -> coords) via Nominatim
  const searchAddress = async (text) => {
    setQuery(text);
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}`,
    );
    const data = await res.json();
    setSuggestions(data);
  };

  const selectSuggestion = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    mapRef.current.setView([lat, lng], 16);
    markerRef.current.setLatLng([lat, lng]);
    setQuery(place.display_name);
    setSuggestions([]);
    onSelect({ lat, lng, formattedAddress: place.display_name });
  };

  return (
    <div>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => searchAddress(e.target.value)}
          placeholder="Type your address"
          className="form-control mb-2"
        />
        {suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              zIndex: 1000,
              background: "white",
              width: "100%",
              listStyle: "none",
              padding: 0,
              margin: 0,
              border: "1px solid #ccc",
            }}
          >
            {suggestions.map((s) => (
              <li
                key={s.place_id}
                onClick={() => selectSuggestion(s)}
                style={{ padding: "8px", cursor: "pointer" }}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div ref={mapContainerRef} style={{ width: "100%", height: "400px" }} />
    </div>
  );
}

export default AddressPicker;
