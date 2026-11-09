package com.fitlifebro.steps

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import java.time.Instant
import java.time.ZoneId
import java.util.UUID

/** Foreground-only test listener. It does not claim background/locked-screen tracking. */
class ForegroundSensorDraft(context: Context, private val show: (String) -> Unit) : SensorEventListener {
    private val manager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val store = SensorDraftStore(context.applicationContext)
    private val handler = Handler(Looper.getMainLooper())
    private var state: SensorDayAccumulator.State? = null
    private var segmentId: String? = null
    private var dirty = false
    private var running = false
    // Each explicit start is a new session; no cumulative reading is carried across starts.
    private var sessionBootId = ""
    private val flushTask = object : Runnable {
        override fun run() { if (!running) return; if (!flush()) return; handler.postDelayed(this, 15_000) }
    }

    fun start() {
        if (running) return
        val sensor = manager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        if (sensor == null) { show("This device has no supported step-counter sensor."); return }
        state = null; segmentId = null; dirty = false; sessionBootId = UUID.randomUUID().toString()
        val registered = try { manager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL) } catch (_: SecurityException) { false }
        if (!registered) { show("Could not start the step sensor. Check physical activity permission."); return }
        running = true; handler.postDelayed(flushTask, 15_000)
        show("Waiting for the first sensor reading. Tracking is foreground-only and partial.")
    }
    override fun onSensorChanged(event: SensorEvent) {
        if (!running || event.sensor.type != Sensor.TYPE_STEP_COUNTER || event.values.isEmpty()) return
        val value = event.values[0]
        if (!value.isFinite() || value < 0 || value >= 16_777_216f || value % 1f != 0f) { fail("Sensor reading cannot be represented safely; tracking stopped."); return }
        val eventElapsed = event.timestamp / 1_000_000
        val age = SystemClock.elapsedRealtime() - eventElapsed
        if (age < 0 || age > 60_000) { fail("The sensor reading is stale; tracking stopped. Try starting again."); return }
        val zone = ZoneId.systemDefault()
        val date = Instant.ofEpochMilli(System.currentTimeMillis() - age).atZone(zone).toLocalDate().toString()
        val prior = state
        if (prior == null) {
            val first = SensorDayAccumulator.start(null, date, zone.id).state
            state = SensorDayAccumulator.reading(first, date, zone.id, value.toLong(), eventElapsed, sessionBootId).state
            segmentId = UUID.randomUUID().toString(); dirty = true
        } else {
            val update = SensorDayAccumulator.reading(prior, date, zone.id, value.toLong(), eventElapsed, sessionBootId)
            if (update.closedDay != null) {
                if (!flush()) return
                segmentId = UUID.randomUUID().toString()
            }
            if (state != update.state) { state = update.state; dirty = true }
        }
        val day = state!!.day
        show("${day.observedSteps} observed steps · ${day.date} (${day.timeZone}). Partial: steps outside this open-app session may be missing.")
    }
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
    fun stop() {
        if (!running) return
        running = false; manager.unregisterListener(this); handler.removeCallbacks(flushTask)
        if (flush()) show("Sensor stopped. Saved partial segments stay on this device; no background tracking.")
    }
    fun close() { stop(); store.close() }
    private fun flush(): Boolean {
        val current = state; val id = segmentId
        if (!dirty || current == null || id == null) return true
        return try { store.save(id, current.day); dirty = false; true }
        catch (_: Exception) { fail("Couldn't save steps on this device; tracking stopped."); false }
    }
    private fun fail(message: String) { running = false; manager.unregisterListener(this); handler.removeCallbacks(flushTask); show(message) }
}
