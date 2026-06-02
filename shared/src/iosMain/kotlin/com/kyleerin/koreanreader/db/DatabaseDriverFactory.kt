package com.kyleerin.koreanreader.db

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver
import com.kyleerin.koreanreader.db.KoreanReaderDb

actual class DatabaseDriverFactory {
    actual fun createDriver(): SqlDriver =
        NativeSqliteDriver(KoreanReaderDb.Schema, "korean_reader.db")
}
