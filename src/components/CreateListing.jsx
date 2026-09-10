import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";
import LocationPicker from "./LocationPicker";

function CreateListing() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    crop_name: "",
    quantity: "",
    unit: "KG",
    price_per_unit: "",
    location: user?.location || "",
    latitude: null,
    longitude: null,
    size: "ANY",
    quality: "ANY",
    condition_type: "ANY",
    description: "",
    available_from: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!user?.id) {
      setMessage("Please login first.");
      return;
    }

    if (user.role !== "FARMER") {
      setMessage("Only farmers can create crop listings.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();

      data.append("farmer_id", user.id);
      data.append("crop_name", formData.crop_name);
      data.append("quantity", formData.quantity);
      data.append("unit", formData.unit);
      data.append("price_per_unit", formData.price_per_unit);
      data.append("location", formData.location);
      if (formData.latitude) data.append("latitude", formData.latitude);
      if (formData.longitude) data.append("longitude", formData.longitude);
      data.append("size", formData.size);
      data.append("quality", formData.quality);
      data.append("condition_type", formData.condition_type);
      data.append("description", formData.description);
      data.append("available_from", formData.available_from);

      if (image) {
        data.append("image", image);
      }

      const response = await fetch(
        `${API}/api/products`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage("Crop listing created successfully!");

        setTimeout(() => {
          navigate("/marketplace");
        }, 1000);
      } else {
        setMessage(result.message || "Failed to create listing.");
      }

    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="listing-page">
      <div className="listing-card">

        <p className="section-label">FARMER MARKETPLACE</p>

        <h1>Add Crop Listing</h1>

        <p>
          List your available produce with quantity, quality and photos.
        </p>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="crop_name"
            placeholder="Crop Name"
            value={formData.crop_name}
            onChange={handleChange}
            required
          />

          <div className="listing-row">
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={handleChange}
              required
            />

            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
            >
              <option value="KG">KG</option>
              <option value="QUINTAL">Quintal</option>
              <option value="TON">Ton</option>
            </select>
          </div>

          <input
            type="number"
            name="price_per_unit"
            placeholder="Price per Unit (₹)"
            min="0"
            step="0.01"
            value={formData.price_per_unit}
            onChange={handleChange}
            required
          />

          <div className="listing-row">
            <select
              name="size"
              value={formData.size}
              onChange={handleChange}
            >
              <option value="ANY">Size - Any</option>
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
              <option value="LARGE">Large</option>
            </select>

            <select
              name="quality"
              value={formData.quality}
              onChange={handleChange}
            >
              <option value="ANY">Quality - Any</option>
              <option value="GRADE_A">Grade A</option>
              <option value="GRADE_B">Grade B</option>
            </select>
          </div>

          <select
            name="condition_type"
            value={formData.condition_type}
            onChange={handleChange}
          >
            <option value="ANY">Condition - Any</option>
            <option value="FRESH">Fresh</option>
            <option value="STANDARD">Standard</option>
          </select>

          <LocationPicker
            label="Pickup Location / Farm Address"
            placeholder="Search pickup place (e.g. Nashik APMC, Pune Market Yard, Vashi APMC)..."
            initialAddress={formData.location}
            initialLat={formData.latitude}
            initialLng={formData.longitude}
            required
            onChange={({ address, lat, lng }) => {
              setFormData((prev) => ({
                ...prev,
                location: address,
                latitude: lat,
                longitude: lng,
              }));
            }}
          />

          <input
            type="date"
            name="available_from"
            value={formData.available_from}
            onChange={handleChange}
            required
          />

          <label className="image-label">
            Crop Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <small>
              Upload one clear photo of your produce.
            </small>
          </label>

          {preview && (
            <img
              src={preview}
              alt="Crop preview"
              className="crop-preview"
            />
          )}

          <textarea
            name="description"
            placeholder="Additional details about your produce"
            rows="4"
            value={formData.description}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Publishing..." : "Publish Listing"}
          </button>

        </form>

        {message && (
          <p className="listing-message">
            {message}
          </p>
        )}

      </div>
    </div>
  );
}

export default CreateListing;