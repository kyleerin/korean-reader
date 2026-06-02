package com.kyleerin.koreanreader.db

import android.content.Context
import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import com.kyleerin.koreanreader.db.KoreanReaderDb

actual class DatabaseDriverFactory(private val context: Context) {
    actual fun createDriver(): SqlDriver =
        AndroidSqliteDriver(KoreanReaderDb.Schema, context, "korean_reader.db")
}
