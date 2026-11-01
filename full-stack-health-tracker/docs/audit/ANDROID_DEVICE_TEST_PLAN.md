# FitLife AI Planner 2.0 — actual Android validation checklist

**Current status: NOT IMPLEMENTED / NOT PHYSICALLY TESTED for pedometer and Health Connect.**

This document is a test procedure, not a claim that native or background tracking works. The current application is a web/PWA application. No Capacitor configuration, Android project, native sensor bridge or released APK/AAB was found in either inspected source tree. Existing Pixel/iPhone browser-emulation tests verify layout/flow only.

## 1. What can be tested on a phone now

1. Open the working application's current published HTTPS URL in Chrome. A temporary preview URL may expire; localhost on the development machine is not a public phone address.
2. Open `/install` or `/download`, or use **Install Fit Life Bro** in the app menu.
3. Choose Chrome's **Install app / Add to Home screen**, then open the icon.
4. Sign in to the same registered account. Record a clearly identified test weight/water entry, reload, then view it from another authorized device. Do not use another person's account or assume guest/demo records automatically follow devices.
5. Check budgeting, recipe sources, single-meal swaps, saved chat and logout. The known audit issues about demo provenance and plan replacement remain open.
6. Test loss of connection: the PWA should show a generic connection page on offline navigation; private APIs/health records must not be served from service-worker cache. Offline writes are not queued.
7. Do not expect a Daily Activity Tracker, real steps, calories burned, Health Connect permission flow or background water alarm: those modules are not delivered by Phase 1.

## 2. Future test setup before evaluating a pedometer

Record for every run:

- Test build ID and source commit; native app ID/version and signing mode.
- Device model, Android version, WebView/Chrome version, Health Connect provider/module version and relevant SDK extension level.
- Availability of `TYPE_STEP_COUNTER` / `TYPE_STEP_DETECTOR` and Health Connect features.
- User-confirmed profile weight/height/timezone and any stride calibration. Do not use the old 76.5 kg demo default as a measured body weight.
- Permission state, battery/optimization restrictions, source apps/watch connections and Health Connect priority order.
- Ground-truth walking procedure: manual observer/video count on a known route, start/end timestamps, distance method and phone placement.
- Clear separation between synthetic test events and actual hardware measurements. Synthetic counts must never enter a real user's history.

Use at least a supported stock Android device, an older/non-equivalent provider configuration, a device with unavailable hardware where possible, and a device with manufacturer battery restrictions. No single emulator is a physical-accuracy test.

## 3. Permission/API policy

### Browser foreground experiment, if later implemented

- HTTPS secure context; capability-test the motion API and actual non-null samples.
- Show a permission explanation before requesting access.
- On browsers exposing `DeviceMotionEvent.requestPermission()`, request only from a user gesture. No prompt on page load.
- Respect denial and missing hardware; provide manual entry and explain that ordinary browsers cannot guarantee continuous closed/locked-screen tracking.
- Capability detection or a fabricated `devicemotion` event does not prove a real step was detected.

### Native hardware adapter, if later implemented

- Check hardware first. `TYPE_STEP_COUNTER` is cumulative since boot while activated; it is not a fresh daily total.
- Android 10/API 29+ requires the relevant activity-recognition permission for step sensors; request it only if this path is used and the user chooses it.
- Persist counter baselines/boot epochs safely. Handle delivery latency, process restarts, duplicate callbacks and negative/reset deltas.
- If a foreground service is necessary, review the target Android version's foreground-service/health requirements and visible-notification obligations. Do not promise unlimited execution against OS policy.

### Health Connect adapter, if later implemented

- Verify provider/SDK and feature availability; Android 14+ framework availability is not equivalent to every background/history/on-device-step feature being available.
- Request **read steps** for step history. Request distance/exercise/active-calorie data only if those types are actually used. Do not request heart rate, location or broad write access as a shortcut.
- Background reads require an additional supported feature and explicit background-read permission. Longer historical reads have separate restrictions/permission; default access commonly covers up to 30 days before permission was first granted.
- Explain provider data use and supply the required privacy/rationale activity and store declarations.
- For cumulative steps, use Health Connect aggregation (`StepsRecord.COUNT_TOTAL`) and account for user data-origin priorities, rather than blindly summing raw records from several apps.
- A Health Connect aggregate plus this app's sensor estimate is **not** two independent walks to add together. Read permission does not authorize writing imported totals back and creating a loop.
- Permission can be revoked outside the app; check before operations and handle revoked/unavailable/partial data honestly.

Official references:

- https://developer.android.com/develop/sensors-and-location/sensors/sensors_motion
- https://developer.android.com/reference/android/hardware/Sensor
- https://developer.android.com/health-and-fitness/health-connect/get-started
- https://developer.android.com/health-and-fitness/health-connect/read-data
- https://developer.android.com/health-and-fitness/health-connect/aggregate-data
- https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static
- https://capacitorjs.com/docs/config

## 4. Physical test matrix — all entries currently NOT RUN

| Case | Required future observation / acceptance evidence |
|---|---|
| Permission granted | Actual provider samples/records appear only after consent; persisted totals match the authorized source |
| Permission denied/revoked | No hidden tracking/read attempts; clear explanation and usable manual fallback |
| Unsupported device/provider | Unavailable state rather than invented counts; no repeated permission loop |
| Foreground walking | Compare multiple known-count walks at slow/normal/brisk pace and different phone placements; report absolute/relative error |
| Stationary/shaking/vehicle/cycling | Measure false positives; do not equate arbitrary acceleration peaks with validated steps |
| Duplicate sensor events | Repeated callbacks/batches do not increase the same observation twice |
| Short/long pauses | Active duration excludes idle time by a documented rule; ambiguous coverage stays labelled |
| App backgrounded | Record actual OS/provider behavior and data gaps; do not infer success from a timer running in a browser test |
| Screen locked | Walk a known route, compare before/after provider records and observation intervals on the actual device |
| Process killed / force-stop | Check documented OS restrictions, resumed coverage, source state and no misleading continuous-tracking claim |
| Phone reboot | Counter reset/boot epoch handled; prior daily totals retained; no giant first-delta count |
| Health Connect multiple sources | Watch/phone/other app records overlap; aggregates and app totals agree with source/priority policy without double counting |
| Sensor + Health Connect overlap | Imported aggregate supersedes/reconciles the same interval, rather than adding duplicate steps/calories |
| Manual + automatic overlap | User can review conflicting intervals; marked manual data is not misrepresented as hardware evidence |
| Network loss / retry | Batches remain owner-bound; idempotent retry; no cross-account replay after logout/login |
| Same account, two devices | Explicit source identities/versions; totals reconciled, not blindly summed |
| Local midnight / month / DST | Correct user-local day buckets, no lost/doubled rollover intervals or monthly-budget confusion |
| Permission/history gap | Missing buckets show missing/partial data, not fabricated zero activity |
| Battery restriction | Document effects and limitations; no unsupported promise of uninterrupted capture |

## 5. Distance and calorie validation

- Label measured/GPS, provider-reported and step/stride-estimated distance differently. No GPS permission should be required for a basic step estimate.
- If distance is inferred from stride, validate the user's calibration assumptions and units; show uncertainty.
- Actual duration and speed/intensity must come from the recorded episode or an explicit manual entry—not a scheduled workout duration.
- Use a documented, versioned MET mapping. The 2024 Adult Compendium has different walking values for different speeds/conditions; it is not one calorie value per 1,000 steps.
- Choose and label gross versus active-above-rest energy. A reference gross equation is `MET × 3.5 × kg / 200 × actual minutes`; a corresponding above-rest estimate uses `max(MET − 1, 0)`.
- Do not add gross exercise energy to TDEE as though all were new active calories. Do not auto-change the food target or automatically encourage eating back a burn estimate.
- Validate overlap reconciliation before summing walking/workout/other totals. Provider calorie records and MET calculations for the same interval cannot both be added.
- Compare calculations with independently checked examples, while labelling all results estimates, not medical measurements. Never seed the dashboard with illustrative readings.

## 6. Release evidence template

For each physical run, save a nonpublic test record containing build/device/provider versions, permission state, source interval IDs, observer ground truth, expected/observed values, error, missing coverage, duplicates handled and result. Remove personal identifiers before sharing. Store no API keys, passwords or recovery keys in test logs.

Use statuses **passed on device**, **failed**, **not run**, **unsupported**, or **implemented but unverified**. The background/locked-screen/reboot rows cannot be marked passed until actual-device evidence exists.

**Current verdict:** PWA installation and existing web flows have automated baseline evidence. Automatic step detection, Health Connect synchronization and background tracking do not yet have implementation or device evidence.
