# Android step-reader draft — not yet runnable or released

`TodayStepsReader.kt` is a read-only Health Connect integration building block. It requests no permission itself, sends no data to the website or server, writes no health data, and does not calculate calories. It checks the current grant before aggregating step records, requests the current local day up to now, distinguishes no data from zero, handles revocation and propagates coroutine cancellation. Health Connect performs the aggregation rather than manually summing overlapping records.

This is deliberately not a complete Android application. The host app still needs Health Connect availability checks, the `android.permission.health.READ_STEPS` manifest declaration, a user-initiated permission request, a privacy/rationale screen, a safe native-to-dashboard integration, refresh/error handling, a walking-specific calorie approach, Android build configuration, SDK compatibility checks and real-device tests. Android SDK/Gradle are not installed in this environment and Google's artifact host is not available through its outbound network policy, so this source has not been compiled. Do not deploy it or represent it as working until a full native build and device test pass.

Android guidance: https://developer.android.com/health-and-fitness/health-connect/features/steps

## Android build prototype

The `app/` directory is a standalone, clearly labeled Android test harness with an explicit Health Connect read-steps permission flow and no network permission, web dashboard, calorie estimator, data upload or background access. It is not the Fit Life Bro app and is not ready to install for normal use. The approved GitHub Actions workflow compiles its debug build; a successful compile alone does not validate runtime behavior. Test permission denial/revocation, no data versus zero, source aggregation and local-day/DST boundaries on real devices before considering integration. The old standalone `src/` copy is retained as the earlier development artifact and is not used by the Android build.
