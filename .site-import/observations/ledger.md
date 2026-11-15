# Observation ledger — https://carecirclefrlife.lovable.app/ → /

| Control | Viewport | Trigger | Expected | Source | Preview | Status |
|---|---|---|---|---|---|---|
| Logo (header/footer) | desktop+phone | link | / | / | / | pass |
| Sign in | desktop+phone | link | /login | /login | /login (page not imported) | pass |
| Create a family | desktop+phone | link | /signup | /signup | /signup (page not imported) | pass |
| Hero CTA "Start your family circle" | desktop+phone | link | /signup | /signup | /signup | pass |
| "I'm an elder" | desktop+phone | link | /login?as=elder | same | same | pass |
| Hero mouse parallax/tilt | desktop | mouse move to (1100,700) | --mx .359, --my -.111, tilt -2.9/1.93deg | matches | matches after repair | pass |
| Scroll to bottom | desktop 1280x1800 / phone 390x844 | wheel | all sections + footer | h=1800 / 2840 | h=1800 / 2840 | pass |

No phone menu, popups, carousels or video exist on the source page.
Removed: two hosting-injected "Edit with Lovable" badges captured from the source (hosting adds its own on publish).
Screenshots: source_/preview_{desktop,phone}_{top,bottom}.png
