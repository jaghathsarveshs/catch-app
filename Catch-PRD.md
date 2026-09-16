# Product Requirements Document (PRD)

**Product Name:** Catch
**Tagline:** "Support the push."
**Document Status:** V1.0 — Hackathon Build Spec
**Target Platform:** Android (Samsung Galaxy Store), built with Expo/React Native
**Event:** RevenueCat Shipaton 2026 — targeting Peace Prize, Next Gen Award, Design Award

---

## 1. Executive Summary & Product Vision

Catch is an offline, voice-guided companion app that supports a bystander when a woman in labor cannot reach a hospital in time. Its vision is narrow and deliberate: not to teach anyone to "deliver" a baby, but to keep a bystander calm, informed, and connected to real emergency help while a mother's own body does what it already knows how to do. Catch draws a firm line between *encouragement and support* — which it actively provides — and *medical technique* — which it never attempts to teach, because that line is exactly where safety research says static instructions stop being reliable.

## 2. Problem Statement

In rural and semi-urban India, transport delays to a hospital are a real, documented contributor to maternal and newborn risk. When labor progresses faster than transport can be arranged, the only person present is often an untrained family member — frightened, unprepared, and with no reliable source of calm, accurate guidance. Existing solutions fail to address this specific moment:

1. **Training-only tools** (e.g., Safe Delivery App) are built for semi-professional birth attendants, not a random family member in the actual moment of crisis.
2. **Coordination-only tools** (e.g., Doula Labour Coach, Labor Together) deliberately stop short of any actual delivery-support guidance.
3. **No existing product** combines real-time, hands-free, India-localized guidance with a direct bridge to real emergency responders.

## 3. User Personas

* **The Bystander:** A family member — spouse, parent, neighbor — present when labor progresses too fast to reach a hospital. Likely panicked, untrained, and in a physical position where their hands are occupied. Needs calm, hands-free, unambiguous guidance and a fast path to real help.
* **The Expectant Mother:** Sets up her profile in advance, during a calm moment in pregnancy — due date, blood type, nearest hospital, emergency contact, and any elevated-risk factors (e.g. prior C-section).
* **The Real Responder (108/102/104 dispatcher or doctor):** Not a user of the app directly, but the actual destination of its two most important buttons — the app's job is to get a real person on the line as fast as possible, not to replace them.

## 4. Functional Requirements

### 4.1 Onboarding
* Collects due date, blood type, nearest hospital, one emergency contact, and language preference (English / Tamil / Hindi at launch).
* **Prior C-section flag:** if marked yes, the app prominently surfaces an elevated-risk warning prioritizing emergency transport over any other guidance.
* Designed to be completed in a calm moment during pregnancy, not under stress.

### 4.2 Home Screen
* Three primary actions only, with no competing clutter: **Emergency Now**, **Practice Mode**, **My Profile**.

### 4.3 Emergency Flow (core feature)
* Full-screen, large-text, auto-advancing steps narrated via on-device text-to-speech — no reading required.
* **Hands-free navigation:** shake the phone once to repeat the current step, shake twice to go back. No touch input required at any point in the critical flow.
* **Persistent action buttons**, visible throughout the entire flow:
  * *Get an Ambulance* → dials 102 (India's dedicated pregnant-women/infant ambulance service), with 108 as fallback.
  * *Talk to a Doctor* → dials 104, India's real 24/7 free medical consultation helpline.
* Pressing either button automatically attaches GPS coordinates and sends an SMS alert to the pre-set emergency contact.
* Step content (see Section 4.3.1) is sourced from cross-checked, published clinical guidance — never freelanced.

#### 4.3.1 Step Content (source-grounded)
**Before birth:** Call for help immediately (102/108) → call a known doctor/midwife if available.
**Supporting delivery:** Encourage pushing with contractions → help find a comfortable position → support the baby's head and body gently as it emerges; never pull.
**Immediately after birth:** Dry and warm the baby (especially the head) → skin-to-skin contact → do not cut or tie the cord → do not pull the cord to deliver the placenta → reassure that some blood/fluid loss is normal.
**Hard escalation triggers** (app response is always "get real help by any means," never a DIY instruction): heavy/unusual bleeding, cord wrapped tightly around the neck, breech presentation, baby not breathing/responding, stalled labor, or a flagged prior C-section.

### 4.4 Practice Mode
* Identical flow to the Emergency screens, clearly and persistently bannered "PRACTICE — no real calls."
* Purpose: build bystander familiarity before an actual emergency, since panic — not the birth itself — is the most consistently cited risk multiplier across every source reviewed.

### 4.5 Contraction Timer
* Simple start/stop timer logging contraction intervals, to help gauge how much time realistically remains.

### 4.6 Settings
* Language selection, emergency contact management, nearest hospital info.

### 4.7 Subscription Tier (RevenueCat)
* **Free, permanently:** the entire Emergency Flow, English + one regional language, limited Practice Mode sessions, one profile.
* **Premium:** additional language packs, unlimited Practice Mode, multiple profiles (real use case: a community health worker tracking several expecting mothers at once).
* **Hard rule:** the emergency/safety path is never gated behind payment, under any circumstance.

## 5. Non-Functional Requirements

* **Fully offline:** no step, TTS output, button, or navigation gesture may depend on network connectivity.
* **Hands-free operable:** the entire emergency flow must be completable without a single reliable tap, given the bystander's hands are realistically occupied.
* **Low-resource build target:** developed via Expo/EAS cloud build specifically to remain buildable on modest hardware, with no local Android Studio/emulator dependency.
* **Multi-language:** English, Tamil, and Hindi at launch, reflecting the actual population most exposed to this problem.

## 6. Safety & Ethical Design Principles

* **Support, not technique.** No abdominal/fundal pressure instructions — this is excluded even for professionals in modern guidance, and is never included here.
* **Escalate, never improvise.** Any abnormal situation routes to "seek real help immediately," never an invented next step.
* **No fabricated features.** Every "connect to help" action must dial a real, working number — never a placeholder or mock interaction.
* **Content provenance.** All instructional content is cross-referenced across multiple independent, authoritative sources (NSW Health clinical policy, Western Sydney University public health guidance, Red Cross–sourced material). A real clinician review is recommended whenever access allows, including post-submission.

## 7. Out of Scope (explicitly excluded)

* Any Caesarean-section or surgical instructional content — rejected outright as unsafe at any framing.
* Live two-way voice command recognition — too high execution risk to build reliably, solo, offline, in this timeframe. Shake-gesture control used instead as the safer hands-free mechanism.
* Fundal pressure / "where to press" guidance.
* Any paywall touching the emergency flow.

## 8. System Dependencies & Integrations

1. **Telephony:** direct dial-intents to India's real emergency numbers — 102 (maternal/infant ambulance), 108 (general ambulance fallback), 104 (medical consultation helpline).
2. **Location & Messaging:** device GPS + SMS auto-alert to the emergency contact, triggered on any call-button press.
3. **RevenueCat:** `react-native-purchases` + `react-native-purchases-store-galaxy` add-on, configured for Samsung Galaxy Store billing (officially supported, SDK 10.3.0+).
4. **Samsung Galaxy Store:** Seller Portal account for subscription product setup, connected to RevenueCat via a Galaxy-specific API key.
5. **On-device TTS and accelerometer APIs** for narration and shake-gesture detection, both required to function fully offline.

## 9. Success Metrics (KPIs)

*Note: these are hackathon-appropriate craft/impact metrics, not growth metrics — Catch is not competing in traction-judged categories.*

* **Early evidence of usefulness:** minimum 3–5 real people (ideally including someone outside the builder's immediate circle) complete the flow and give feedback before submission — directly satisfies Peace Prize's "early evidence" criterion.
* **Escalation correctness:** 100% of the defined red-flag scenarios (Section 4.3.1) route to "seek help," with zero instances of the app attempting to guide a user through a complication.
* **Hands-free completion:** the emergency flow must be completable start-to-finish via shake gestures alone, verified by real-device testing.
* **Offline integrity:** zero network dependency across every screen, verified with airplane mode testing before submission.
