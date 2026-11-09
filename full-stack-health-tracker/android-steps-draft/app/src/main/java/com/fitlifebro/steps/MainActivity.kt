package com.fitlifebro.steps

import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import java.text.NumberFormat

/** Standalone test harness only: it does not connect to the website or sync health data. */
class MainActivity : ComponentActivity() {
    private lateinit var status: TextView
    private val required = setOf(HealthPermission.getReadPermission(StepsRecord::class))
    private val requestAccess = registerForActivityResult(PermissionController.createRequestPermissionResultContract()) { granted ->
        if (granted.containsAll(required)) refresh() else status.text = "Steps permission not granted. No steps were read."
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val page = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(32, 32, 32, 32); gravity = Gravity.TOP }
        val title = TextView(this).apply { text = "Steps — Android test"; textSize = 24f }
        val explanation = TextView(this).apply { text = "This prototype reads today's steps from Health Connect only after you choose Connect. It does not write or upload health data. Permission can be revoked in Health Connect. Calories are not calculated." }
        status = TextView(this).apply { text = "Not connected."; textSize = 20f }
        val connect = Button(this).apply { text = "Connect Health Connect"; setOnClickListener { connect() } }
        val refresh = Button(this).apply { text = "Refresh steps"; setOnClickListener { refresh() } }
        page.addView(title); page.addView(explanation); page.addView(status); page.addView(connect); page.addView(refresh)
        setContentView(page)
    }

    private fun available() = HealthConnectClient.getSdkStatus(this) == HealthConnectClient.SDK_AVAILABLE
    private fun connect() {
        if (!available()) { status.text = "Health Connect is unavailable or needs an update on this device."; return }
        lifecycleScope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(this@MainActivity)
                if (client.permissionController.getGrantedPermissions().containsAll(required)) refresh() else requestAccess.launch(required)
            } catch (_: Exception) { status.text = "Could not open Health Connect permissions." }
        }
    }
    private fun refresh() {
        if (!available()) { status.text = "Health Connect is unavailable or needs an update on this device."; return }
        lifecycleScope.launch {
            status.text = "Checking today's steps…"
            val result = try { TodayStepsReader(HealthConnectClient.getOrCreate(this@MainActivity)).read() } catch (_: IllegalStateException) { TodayStepsReader.Result.Unavailable }
            status.text = when (result) {
                is TodayStepsReader.Result.Available -> "${NumberFormat.getIntegerInstance().format(result.count)} steps · ${result.localDate} (${result.zoneId})"
                TodayStepsReader.Result.PermissionRequired -> "Steps permission is required. Choose Connect."
                TodayStepsReader.Result.NoData -> "No step data available today."
                TodayStepsReader.Result.Unavailable -> "Couldn't read Health Connect. Try again."
            }
        }
    }
}
