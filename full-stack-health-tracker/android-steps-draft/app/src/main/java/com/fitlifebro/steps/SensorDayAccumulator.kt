package com.fitlifebro.steps

/** Pure draft reducer. A host must durably store state and closed days atomically.
 * The total is only the observed increment while listening, not a full-day total. */
object SensorDayAccumulator {
    data class Day(val date: String, val timeZone: String, val observedSteps: Long, val partial: Boolean)
    data class State(val day: Day, val lastCounter: Long?, val lastElapsedMs: Long?, val bootId: String?)
    data class Update(val state: State, val closedDay: Day? = null)

    /** Call whenever a listener starts or restarts: never infer steps while inactive. */
    fun start(previous: State?, date: String, timeZone: String): Update {
        require(date.isNotBlank() && timeZone.isNotBlank())
        val sameDay = previous != null && previous.day.date == date && previous.day.timeZone == timeZone
        val day = if (sameDay) previous!!.day.copy(partial = true) else Day(date, timeZone, 0, true)
        return Update(State(day, null, null, null), if (previous != null && !sameDay) previous.day.copy(partial = true) else null)
    }

    /** Cumulative counter events are boot-relative. Intervals crossing date/zone,
     * reset or reboot are intentionally left unallocated and marked partial. */
    fun reading(previous: State, date: String, timeZone: String, counter: Long, elapsedMs: Long, bootId: String): Update {
        require(date.isNotBlank() && timeZone.isNotBlank() && counter >= 0 && elapsedMs >= 0 && bootId.isNotBlank())
        if (previous.bootId == bootId && previous.lastElapsedMs != null && elapsedMs <= previous.lastElapsedMs) return Update(previous)
        val changedDay = previous.day.date != date || previous.day.timeZone != timeZone
        if (changedDay) return Update(State(Day(date, timeZone, 0, true), counter, elapsedMs, bootId), previous.day.copy(partial = true))
        val last = previous.lastCounter
        val lastElapsed = previous.lastElapsedMs
        if (last == null || lastElapsed == null) return Update(State(previous.day.copy(partial = true), counter, elapsedMs, bootId))
        if (previous.bootId != bootId) return Update(State(previous.day.copy(partial = true), counter, elapsedMs, bootId))
        if (counter < last) return Update(State(previous.day.copy(partial = true), counter, elapsedMs, bootId))
        val delta = counter - last
        if (delta > Long.MAX_VALUE - previous.day.observedSteps) throw ArithmeticException("Step total overflow")
        return Update(State(previous.day.copy(observedSteps = previous.day.observedSteps + delta), counter, elapsedMs, bootId))
    }
}
