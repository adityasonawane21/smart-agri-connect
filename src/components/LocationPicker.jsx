import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API } from "../config";

const DEFAULT_MAP_CENTER = { lat: 19.076, lng: 72.8777, label: "Mumbai, Maharashtra, India" };
const LOCAL_PLACES = [
  DEFAULT_MAP_CENTER,
  { lat: 19.9975, lng: 73.7898, label: "Nashik, Maharashtra, India" },
  { lat: 18.5204, lng: 73.8567, label: "Pune, Maharashtra, India" },
  { lat: 19.033, lng: 73.0297, label: "Navi Mumbai, Maharashtra, India" },
  { lat: 19.2183, lng: 72.9781, label: "Thane, Maharashtra, India" },
];

/**
 * LocationPicker Component
 * Features:
 * - Debounced (350ms) place search with autocomplete dropdown
 * - Automatic latitude/longitude extraction upon selection
 * - Automatic Leaflet preview map with draggable/interactive marker
 * - Map click to reverse-geocode and auto-fill address
 * - Keeps address and coordinates strictly synchronized
 * - Never requires user to type lat/lng manually
 */
function LocationPicker({
  label = "Location",
  placeholder = "Search place (e.g. Nashik APMC, Pune Market Yard)...",
  initialAddress = "",
  initialLat = null,
  initialLng = null,
  required = false,
  onChange,
}) {
  const [query, setQuery] = useState(initialAddress || "");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLat && initialLng
      ? { address: initialAddress, lat: Number(initialLat), lng: Number(initialLng) }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");

  const debounceTimerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  // Sync with initial props if they change
  useEffect(() => {
    if (initialAddress && !query) {
      setQuery(initialAddress);
    }
    if (initialLat && initialLng && !selectedLocation) {
      setSelectedLocation({
        address: initialAddress,
        lat: Number(initialLat),
        lng: Number(initialLng),
      });
    }
  }, [initialAddress, initialLat, initialLng]);

  // Search places via backend API
  const searchPlaces = async (text) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    setError("");
    const fallbackPlaces = LOCAL_PLACES
      .filter((place) => place.label.toLowerCase().includes(text.trim().toLowerCase()))
      .map((place) => ({
        display_name: place.label,
        address: place.label,
        lat: place.lat,
        lng: place.lng,
        type: "local_fallback",
      }));
    try {
      const res = await fetch(`${API}/api/locations/search?q=${encodeURIComponent(text.trim())}`);
      if (!res.ok) throw new Error("Location search unavailable");
      const data = await res.json();
      if (data.success && Array.isArray(data.places)) {
        setSuggestions(data.places);
        setShowDropdown(data.places.length > 0);
        if (data.places.length === 0) {
          setError("No places found. Try another search term or click on the map.");
        }
      } else {
        throw new Error("Invalid location search response");
      }
    } catch (e) {
      // Render can briefly cold-start. Keep common Indian city searches usable
      // while the server-side geocoder becomes available.
      setSuggestions(fallbackPlaces);
      setShowDropdown(fallbackPlaces.length > 0);
      setError(
        fallbackPlaces.length
          ? "Using an offline city suggestion while search wakes up."
          : "Unable to search this location. Click the map to pin it instead."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle typing with 350ms debounce
  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);

    // If user modifies text, invalidate the previously confirmed coordinates to avoid desync
    if (selectedLocation && text !== selectedLocation.address) {
      setSelectedLocation(null);
      if (onChange) {
        onChange({ address: text, lat: null, lng: null });
      }
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 350);
  };

  // Select place from dropdown
  const handleSelectPlace = (place) => {
    const lat = Number(place.lat);
    const lng = Number(place.lng);
    const address = place.address || place.display_name;

    setQuery(address);
    setSelectedLocation({ address, lat, lng });
    setShowDropdown(false);
    setError("");

    if (onChange) {
      onChange({ address, lat, lng });
    }

    updateMap(lat, lng, address);
  };

  // Reverse geocode when map is clicked
  const reverseGeocode = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/locations/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      const address = data.address || `Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

      setQuery(address);
      setSelectedLocation({ address, lat, lng });
      if (onChange) {
        onChange({ address, lat, lng });
      }
    } catch (e) {
      const fallback = `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setQuery(fallback);
      setSelectedLocation({ address: fallback, lat, lng });
      if (onChange) {
        onChange({ address: fallback, lat, lng });
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize or update Leaflet Map
  const updateMap = useCallback((lat, lng, title = "Selected Location", showMarker = true) => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        }
        reverseGeocode(clickLat, clickLng);
      });

      leafletMapRef.current = map;
    } else {
      leafletMapRef.current.setView([lat, lng], 13);
    }

    // Leaflet needs a size refresh after React has laid out the map container.
    requestAnimationFrame(() => leafletMapRef.current?.invalidateSize());

    if (!showMarker) return;

    const icon = L.divIcon({
      className: "",
      html: `<div class="location-picker-marker">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]).bindPopup(`<strong>${title}</strong>`).openPopup();
    } else {
      markerRef.current = L.marker([lat, lng], { icon, draggable: true })
        .addTo(leafletMapRef.current)
        .bindPopup(`<strong>${title}</strong>`)
        .openPopup();

      markerRef.current.on("dragend", (e) => {
        const { lat: dragLat, lng: dragLng } = e.target.getLatLng();
        reverseGeocode(dragLat, dragLng);
      });
    }
  }, []);

  // Start with a usable Mumbai map even before the user selects a suggestion.
  // Leaflet is bundled with the app, avoiding a CDN script that can be blocked.
  useEffect(() => {
    const location = selectedLocation || DEFAULT_MAP_CENTER;
    updateMap(location.lat, location.lng, location.address || location.label, Boolean(selectedLocation));

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map when selected location changes
  useEffect(() => {
    if (selectedLocation?.lat && selectedLocation?.lng) {
      updateMap(selectedLocation.lat, selectedLocation.lng, selectedLocation.address);
    }
  }, [selectedLocation, updateMap]);

  return (
    <div className="location-picker-wrapper">
      <label className="location-picker-label">
        <span>{label} {required && <strong className="required-star">*</strong>}</span>
        <div className="location-picker-input-container">
          <span className="location-input-icon">🔍</span>
          <input
            type="text"
            className="location-search-input"
            value={query}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            autoComplete="off"
            required={required}
          />
          {loading && <span className="location-spinner">⏳</span>}
          {query && !loading && (
            <button
              type="button"
              className="location-clear-btn"
              onClick={() => {
                setQuery("");
                setSelectedLocation(null);
                setSuggestions([]);
                setShowDropdown(false);
                if (onChange) onChange({ address: "", lat: null, lng: null });
              }}
            >
              ✕
            </button>
          )}
        </div>
      </label>

      {/* Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <ul className="location-autocomplete-dropdown">
          {suggestions.map((place, idx) => (
            <li
              key={idx}
              className="location-suggestion-item"
              onClick={() => handleSelectPlace(place)}
            >
              <span className="suggestion-icon">📍</span>
              <div className="suggestion-text">
                <strong>{place.display_name.split(",")[0]}</strong>
                <small>{place.display_name}</small>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <div className="location-error-msg">{error}</div>}

      {/* Coordinates Confirmation Status */}
      {selectedLocation?.lat && selectedLocation?.lng ? (
        <div className="location-confirmed-badge">
          <span className="check-icon">✓</span>
          <div>
            <strong>Location selected</strong>
            <span className="coord-text">
              Latitude: <code>{Number(selectedLocation.lat).toFixed(6)}</code> • Longitude: <code>{Number(selectedLocation.lng).toFixed(6)}</code>
            </span>
          </div>
        </div>
      ) : query && !loading ? (
        <div className="location-pending-hint">
          <span>⚠️ Please click a dropdown result or click the map below to confirm exact coordinates.</span>
        </div>
      ) : null}

      {/* Interactive Map Preview */}
      <div className="location-map-container">
        <div className="location-map-header">
          <small>🗺️ Click anywhere on the map or drag the pin to refine location</small>
        </div>
        <div
          ref={mapContainerRef}
          className="location-leaflet-map"
          style={{ height: "220px", width: "100%", borderRadius: "8px" }}
        />
      </div>
    </div>
  );
}

export default LocationPicker;
