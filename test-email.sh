# Test Script za Email Notifikacije

# 1. Testiraj bez autorizacije (development)
curl http://localhost:3000/api/cron/check-expiry

# 2. Testiraj sa autorizacijom (ako je CRON_SECRET postavljen)
curl http://localhost:3000/api/cron/check-expiry \
  -H "Authorization: Bearer your-cron-secret"

# 3. Testiraj na produkciji
curl https://your-domain.com/api/cron/check-expiry \
  -H "Authorization: Bearer your-cron-secret"

# Očekivani response:
# {
#   "success": true,
#   "emailsSent": 2,
#   "emails": ["user1@example.com", "user2@example.com"],
#   "timestamp": "2026-01-18T14:30:00.000Z"
# }

# Ili ako nema vozila koja ističu:
# {
#   "success": true,
#   "emailsSent": 0,
#   "emails": [],
#   "timestamp": "2026-01-18T14:30:00.000Z"
# }
