import re

with open('js/firebase-config.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "'registered'": "'contacted'",
    "'webinar_attended'": "'options_sent'",
    "'vip_trip_booked'": "'properties_visited'",
    "'vip_trip_completed'": "'properties_visited'",
    "'property_search'": "'properties_visited'",
    "'offer_made'": "'offer_made'",
    "'closing'": "'notary_pending'",
    "'completed'": "'closed'"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('js/firebase-config.js', 'w', encoding='utf-8') as f:
    f.write(content)
