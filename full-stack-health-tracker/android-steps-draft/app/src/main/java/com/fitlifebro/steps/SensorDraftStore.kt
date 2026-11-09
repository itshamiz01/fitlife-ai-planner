package com.fitlifebro.steps

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/** Local prototype storage. Each listening interval/day gets a new segment;
 * never replace a different segment, including when timezone changes back. */
class SensorDraftStore(context: Context) : SQLiteOpenHelper(context, "steps-draft.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE segments (id TEXT PRIMARY KEY, day TEXT NOT NULL, zone TEXT NOT NULL, steps INTEGER NOT NULL, partial INTEGER NOT NULL)")
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) { throw IllegalStateException("Migration required; step history must not be discarded") }
    fun save(id: String, day: SensorDayAccumulator.Day) {
        val row = ContentValues().apply {
            put("id", id); put("day", day.date); put("zone", day.timeZone); put("steps", day.observedSteps); put("partial", if (day.partial) 1 else 0)
        }
        writableDatabase.insertWithOnConflict("segments", null, row, SQLiteDatabase.CONFLICT_REPLACE)
    }
}
