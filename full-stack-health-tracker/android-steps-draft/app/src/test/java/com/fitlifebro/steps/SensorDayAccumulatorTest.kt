package com.fitlifebro.steps

import org.junit.Assert.*
import org.junit.Test

class SensorDayAccumulatorTest {
    private val a = SensorDayAccumulator
    private val date = "2026-03-08"
    private val zone = "America/New_York"
    @Test fun baselineIsNotStepsAndDuplicatesAreIgnored() {
        val started = a.start(null, date, zone).state
        val first = a.reading(started, date, zone, 10000, 100, "boot-1").state
        assertEquals(0L, first.day.observedSteps)
        val next = a.reading(first, date, zone, 10012, 200, "boot-1").state
        assertEquals(12L, next.day.observedSteps)
        assertEquals(next, a.reading(next, date, zone, 10012, 200, "boot-1").state)
        assertEquals(next, a.reading(next, date, zone, 10010, 150, "boot-1").state)
        assertTrue(next.day.partial)
    }
    @Test fun restartCreatesNewBaselineAndDoesNotAttributeInactiveSteps() {
        val old = a.reading(a.start(null,date,zone).state,date,zone,100,100, "boot-1").state
        val counted = a.reading(old,date,zone,110,200, "boot-1").state
        val resumed = a.start(counted,date,zone).state
        val baseline = a.reading(resumed,date,zone,150,300, "boot-1").state
        assertEquals(10L, baseline.day.observedSteps)
        assertEquals(15L, a.reading(baseline,date,zone,155,400, "boot-1").state.day.observedSteps)
    }
    @Test fun dayAndTimezoneChangesDoNotInventAllocation() {
        val initial = a.reading(a.start(null,date,zone).state,date,zone,100,100, "boot-1").state
        val previous = a.reading(initial,date,zone,110,200, "boot-1").state
        val next = a.reading(previous,"2026-03-09",zone,130,300, "boot-1")
        assertEquals(10L, next.closedDay!!.observedSteps); assertTrue(next.closedDay!!.partial)
        assertEquals(0L, next.state.day.observedSteps)
        assertEquals(next.state,a.reading(next.state,date,zone,120,250,"boot-1").state)
        val moved = a.reading(next.state,"2026-03-09","Asia/Kolkata",140,400, "boot-1")
        assertEquals(0L,moved.closedDay!!.observedSteps); assertEquals(0L,moved.state.day.observedSteps)
    }
    @Test fun rebootUsesFreshBaselineEvenIfNewCounterIsLarger() {
        val initial = a.reading(a.start(null,date,zone).state,date,zone,100,100,"boot-1").state
        val reboot = a.reading(initial,date,zone,130,10,"boot-2").state
        assertEquals(0L,reboot.day.observedSteps)
        assertEquals(2L,a.reading(reboot,date,zone,132,20,"boot-2").state.day.observedSteps)
    }
    @Test fun counterResetRebaselinesAndRejectsNegativeAndOutOfOrder() {
        val initial = a.reading(a.start(null,date,zone).state,date,zone,100,100, "boot-1").state
        val reset = a.reading(initial,date,zone,3,200, "boot-1").state
        assertEquals(0L, reset.day.observedSteps)
        assertEquals(4L, a.reading(reset,date,zone,7,300, "boot-1").state.day.observedSteps)
        assertThrows(IllegalArgumentException::class.java) { a.reading(reset,date,zone,-1,301, "boot-1") }
    }
}
