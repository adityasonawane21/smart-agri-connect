import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../config";

function Marketplace() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ contactName: user?.name || "", phone: user?.phone || "", city: user?.location || "Mumbai", address: "", date: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { setForm((f) => ({...f, contactName:user?.name||"", phone:user?.phone||"", city:user?.location||"Mumbai"})); }, [user?.id]);

  const fetchProducts = async () => {
    try { const r=await fetch(`${API}/api/products`); const d=await r.json(); if(!r.ok) throw new Error(d.message); setProducts(d); }
    catch(e){ setMessage(e.message || "Unable to connect to server."); }
    finally { setLoading(false); }
  };

  const openRequest = (p) => {
    if (user?.role !== "BUYER") { setMessage("Please login as a buyer to request farmer supply."); return; }
    setSelected(p);
    setForm({contactName:user.name||"",phone:user.phone||"",city:user.location||"Mumbai",address:"",date:"",message:""});
  };
  const close = () => setSelected(null);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) return setMessage("Phone number is required for buyer-farmer coordination.");
    if (!form.address.trim()) return setMessage("Please enter the complete delivery address.");
    if (!form.date) return setMessage("Please select a delivery date.");
    setSending(true); setMessage("");
    try {
      const r=await fetch(`${API}/api/buyer-requests`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({buyer_id:user.id,farmer_id:selected.farmer_id,product_id:selected.id,requested_quantity:Number(form.qty),offered_price_per_unit:Number(selected.price_per_unit),delivery_city:form.city,delivery_address:form.address,delivery_contact_name:form.contactName,delivery_phone:form.phone,required_date:form.date,message:form.message})});
      const d=await r.json(); if(!r.ok) throw new Error(d.message); close(); setMessage("Supply request sent to the farmer. Track it in My Orders after acceptance.");
    } catch(e){setMessage(e.message||"Unable to send request.");} finally{setSending(false);}
  };

  return <div className="marketplace-page"><div className="marketplace-container">
    <div className="marketplace-header"><div><p className="section-label">DIRECT MARKETPLACE</p><h1>Available Produce</h1><p>Buy directly from farmers with clear quantity, price and pickup details.</p></div>{user?.role === "FARMER" && <Link to="/create-listing" className="marketplace-action">+ Add Crop Listing</Link>}</div>
    {message && <div className="demand-message-box">{message}</div>}
    {loading && <p className="marketplace-status">Loading listings...</p>}
    {!loading && products.length===0 && <div className="empty-marketplace"><h2>No listings available</h2><p>Farmers can publish produce from their dashboard.</p>{user?.role === "FARMER" && <Link to="/create-listing" className="marketplace-action">Add First Listing</Link>}</div>}
    {!loading && products.length>0 && <div className="product-grid">{products.map((p)=><div className="product-card" key={p.id}>
      {p.image_url && <img src={`${API}${p.image_url}`} alt={p.crop_name} className="product-image"/>}
      <div className="product-card-top"><span className="product-status">AVAILABLE</span><span className="product-location">{p.location}</span></div>
      <h2>{p.crop_name}</h2>
      <div className="product-details"><div><span>Available</span><strong>{Number(p.quantity).toFixed(2)} {p.unit}</strong></div><div><span>Price</span><strong>₹{Number(p.price_per_unit).toFixed(2)}/{p.unit}</strong></div></div>
      <div className="product-farmer"><span>Farmer</span><strong>{p.farmer_name}</strong></div>
      <div className="listing-tags"><span>{p.size || "ANY"}</span><span>{p.quality || "ANY"}</span><span>{p.condition_type || "ANY"}</span></div>
      {p.description && <p className="product-description">{p.description}</p>}
      {user?.role === "BUYER" && <button type="button" className="marketplace-action" onClick={()=>openRequest(p)}>Request Supply</button>}
      {user?.role === "FARMER" && <p className="marketplace-card-note">Visible to buyers. Buyer requests appear in your Buyer Requests inbox.</p>}
      {!user && <p className="marketplace-card-note">Login as a buyer to request this produce.</p>}
    </div>)}</div>}

    {selected && <div className="modal-overlay" onMouseDown={close}><div className="request-modal" onMouseDown={(e)=>e.stopPropagation()}>
      <div className="request-modal-header"><div><p className="section-label">DIRECT SUPPLY REQUEST</p><h2>Request {selected.crop_name}</h2><p>{selected.farmer_name} • pickup from {selected.location}</p></div><button className="modal-close" onClick={close}>×</button></div>
      <div className="request-product-summary"><div><span>Available</span><strong>{Number(selected.quantity).toFixed(2)} {selected.unit}</strong></div><div><span>Listed Price</span><strong>₹{Number(selected.price_per_unit).toFixed(2)}/{selected.unit}</strong></div></div>
      <form onSubmit={submit}>
        <div className="form-grid"><label>Quantity<input type="number" min="0.01" max={selected.quantity} step="0.01" value={form.qty||""} onChange={e=>setForm({...form,qty:e.target.value})} required/></label><label>Delivery Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label></div>
        <div className="form-grid"><label>Contact Name<input value={form.contactName} onChange={e=>setForm({...form,contactName:e.target.value})} required/></label><label>Phone Number<input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></label></div>
        <label>Delivery City<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required/></label>
        <label>Complete Delivery Address<textarea rows="3" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Shop / restaurant / warehouse address" required/></label>
        <label>Message to Farmer<textarea rows="3" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Example: Please deliver before 5 PM."/></label>
        <p className="small-hint">Your phone and delivery details are shared with the farmer after the request is sent so both sides can coordinate the order.</p>
        <div className="request-modal-actions"><button type="button" className="secondary-action" onClick={close}>Cancel</button><button className="marketplace-action" disabled={sending}>{sending?"Sending...":"Send Request"}</button></div>
      </form>
    </div></div>}
  </div></div>;
}
export default Marketplace;
