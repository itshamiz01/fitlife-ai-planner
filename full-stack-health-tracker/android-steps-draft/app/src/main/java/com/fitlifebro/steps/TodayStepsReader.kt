package com.fitlifebro.steps

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId
import kotlinx.coroutines.CancellationException

/** Read-only building block, not an Android application or a web bridge. */
class TodayStepsReader(private val client: HealthConnectClient, private val clock: Clock = Clock.systemUTC()) {
    sealed interface Result {
        data class Available(val count: Long, val localDate: LocalDate, val zoneId: ZoneId) : Result
        data object PermissionRequired : Result
        data object NoData : Result
        data object Unavailable : Result
    }

    suspend fun read(zone: ZoneId = ZoneId.systemDefault()): Result {
        return try {
            val required = HealthPermission.getReadPermission(StepsRecord::class)
            if (required !in client.permissionController.getGrantedPermissions()) return Result.PermissionRequired
            val date = LocalDate.now(clock.withZone(zone))
            val start = date.atStartOfDay(zone).toInstant()
            // Query to now, rather than a future instant. Local start-of-day handles DST.
            val end = clock.instant()
            if (!end.isAfter(start)) return Result.NoData
            val result = client.aggregate(AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(start, end),
            ))
            val total = result[StepsRecord.COUNT_TOTAL] ?: return Result.NoData
            if (total < 0) Result.Unavailable else Result.Available(total, date, zone)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: SecurityException) {
            Result.PermissionRequired
        } catch (_: Exception) {
            Result.Unavailable
        }
    }
}
