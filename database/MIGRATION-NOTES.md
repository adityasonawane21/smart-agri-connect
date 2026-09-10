# Smart Agri Connect database migration

The backend performs additive schema checks automatically at startup.
It never drops, truncates, or recreates the existing application tables.

For an existing database, start the backend and wait for:

- MySQL connected successfully!
- Database schema ready. Existing tables/data preserved.
- Server running on http://localhost:5000

The backend adds missing columns required by the current order, buyer-request,
and shipment workflows. Existing rows are preserved.


Startup migration is legacy-safe: malformed legacy dates are converted where possible and otherwise set to NULL; order total_amount is populated from quantity × price. Existing tables/data are preserved.
