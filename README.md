# Smart Agri Connect — SIH 2026 Final

This package is the consolidated final prototype for PS 26033.

## Core flow
Buyer Marketplace → direct quantity request → farmer accepts/rejects → order created → shipment grouping → optimized route map → packed → ready to dispatch → in transit → arrived → delivered.

## Multiple-order consolidation
Orders with the same crop, delivery city and compatible capacity can share one shipment. Example: Aditya 400 KG Mumbai + Pratham 100 KG Mumbai → one 500 KG shipment.

## Stock logic
A 500 KG listing with a 400 KG accepted order becomes 100 KG available. When remaining stock reaches 0, the listing is marked SOLD.

## Interaction
Phone number is required during buyer registration and direct order request. Farmer and buyer phone numbers are shown on the order detail so the two sides can coordinate. Call buttons use the device's `tel:` handler.

## Map
Smart Logistics uses a native SVG route map. It does not require a Google Maps API key. City coordinates are prototype coordinates; ETA and transport costs are labelled/treated as estimates.

## Database safety
The backend only creates missing tables/columns. It never drops or truncates your existing `smart_agri_connect` data. On startup it also backfills existing accepted supply offers into the order/shipment layer when possible.

## Run
1. Create `backend/.env` from `.env.example` and point it to the existing database.
2. Backend:
   `cd backend`
   `npm install`
   `node server.js`
3. Frontend from project root:
   `npm install`
   `npm run dev`
4. Open `http://localhost:5173`

## Suggested SIH demo
Use a buyer demand for 1000 KG onion and accepted farmer supplies of 100 KG Nashik + 500 KG Pune + 400 KG Thane. Then open Smart Logistics to show the consolidated shipment, route, ETA and fair transport split.
