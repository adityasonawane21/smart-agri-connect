import { useState, useEffect, useRef, useCallback } from "react";
import { API } from "../config";

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
    try {
      const res = await fetch(`${API}/api/locations/search?q=${encodeURIComponent(text.trim())}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.places)) {
        setSuggestions(data.places);
        setShowDropdown(data.places.length > 0);
        if (data.places.length === 0) {
          setError("No places found. Try another search term or click on the map.");
        }
      }
    } catch (e) {
      setError("Unable to search this location. Try again.");
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
  const updateMap = useCallback((lat, lng, title = "Selected Location") => {
    if (!window.L || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 13,
      });

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
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

    const icon = window.L.divIcon({
      className: "",
      html: `<div class="location-picker-marker">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]).bindPopup(`<strong>${title}</strong>`).openPopup();
    } else {
      markerRef.current = window.L.marker([lat, lng], { icon, draggable: true })
        .addTo(leafletMapRef.current)
        .bindPopup(`<strong>${title}</strong>`)
        .openPopup();

      markerRef.current.on("dragend", (e) => {
        const { lat: dragLat, lng: dragLng } = e.target.getLatLng();
        reverseGeocode(dragLat, dragLng);
      });
    }
  }, []);

  // Load Leaflet dynamically if not loaded
  useEffect(() => {
    if (window.L) {
      if (selectedLocation?.lat && selectedLocation?.lng) {
        updateMap(selectedLocation.lat, selectedLocation.lng, selectedLocation.address);
      }
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (selectedLocation?.lat && selectedLocation?.lng) {
        updateMap(selectedLocation.lat, selectedLocation.lng, selectedLocation.address);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map when selected location changes
  useEffect(() => {
    if (selectedLocation?.lat && selectedLocation?.lng && window.L) {
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
