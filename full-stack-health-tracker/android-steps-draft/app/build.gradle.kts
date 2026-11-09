plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

android {
    namespace = "com.fitlifebro.steps"
    compileSdk = 36
    defaultConfig { applicationId = "com.fitlifebro.steps.draft"; minSdk = 26; targetSdk = 35; versionCode = 1; versionName = "0.1-draft" }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.health.connect:connect-client:1.1.0")
}
