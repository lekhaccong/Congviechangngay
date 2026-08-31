package com.congviechangngay.pro

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

private const val DB_NAME = "cvhn.db"
private const val DB_VERSION = 2

class AppDb(ctx: Context) : SQLiteOpenHelper(ctx, DB_NAME, null, DB_VERSION) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""CREATE TABLE daily_tasks(
            id INTEGER PRIMARY KEY AUTOINCREMENT, number INTEGER, title TEXT, date TEXT, shift TEXT,
            status TEXT, started INTEGER, finished INTEGER, minutes INTEGER DEFAULT 30,
            note TEXT DEFAULT '', problem INTEGER DEFAULT 0, UNIQUE(number, date, shift))""")
        db.execSQL("""CREATE TABLE todos(
            id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, detail TEXT, related TEXT,
            created TEXT, due TEXT, progress INTEGER, priority TEXT, status TEXT)""")
        db.execSQL("""CREATE TABLE attachments(
            id INTEGER PRIMARY KEY AUTOINCREMENT, ownerType TEXT, ownerId INTEGER, path TEXT)""")
        createBusinessTables(db)
    }

    private fun createBusinessTables(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE IF NOT EXISTS personnel(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, groupName TEXT, shift TEXT, date TEXT, ot REAL DEFAULT 0)")
        db.execSQL("CREATE TABLE IF NOT EXISTS ot_records(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, name TEXT, hours REAL, reason TEXT, status TEXT)")
        db.execSQL("CREATE TABLE IF NOT EXISTS amh_records(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, code TEXT, qty INTEGER, note TEXT)")
        db.execSQL("CREATE TABLE IF NOT EXISTS shipments(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, code TEXT, invoice TEXT, qty INTEGER, status TEXT, note TEXT)")
        db.execSQL("CREATE TABLE IF NOT EXISTS data_records(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, code TEXT, design TEXT, qty INTEGER, status TEXT, note TEXT)")
        db.execSQL("CREATE TABLE IF NOT EXISTS lots(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, lot TEXT, code TEXT, status TEXT, emailTo TEXT, note TEXT)")
        db.execSQL("CREATE TABLE IF NOT EXISTS mail_records(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, subject TEXT, sender TEXT, status TEXT, note TEXT)")
    }

    override fun onUpgrade(db: SQLiteDatabase, old: Int, new: Int) = createBusinessTables(db)

    fun ensureDay(date: String, shift: String) {
        TASK_NAMES.forEachIndexed { i, t ->
            writableDatabase.execSQL(
                "INSERT OR IGNORE INTO daily_tasks(number,title,date,shift,status,minutes) VALUES(?,?,?,?,?,30)",
                arrayOf(i + 1, t, date, shift, "CHƯA LÀM")
            )
        }
    }

    fun tasks(date: String, shift: String): List<DailyTask> {
        ensureDay(date, shift)
        val c = readableDatabase.rawQuery(
            "SELECT * FROM daily_tasks WHERE date=? AND shift=? ORDER BY number", arrayOf(date, shift)
        )
        val o = mutableListOf<DailyTask>()
        c.use {
            while (it.moveToNext()) o += DailyTask(
                it.getLong(0), it.getInt(1), it.getString(2), it.getString(3), it.getString(4),
                it.getString(5), if (it.isNull(6)) null else it.getLong(6),
                if (it.isNull(7)) null else it.getLong(7), it.getInt(8),
                it.getString(9) ?: "", it.getInt(10) == 1
            )
        }
        return o
    }

    fun updateTask(id: Long, status: String, note: String, problem: Boolean, started: Long?, finished: Long?) {
        writableDatabase.execSQL(
            "UPDATE daily_tasks SET status=?,note=?,problem=?,started=?,finished=? WHERE id=?",
            arrayOf(status, note, if (problem) 1 else 0, started, finished, id)
        )
    }

    fun historyDates(): List<String> {
        val c = readableDatabase.rawQuery("SELECT DISTINCT date FROM daily_tasks ORDER BY date DESC LIMIT 60", null)
        val o = mutableListOf<String>()
        c.use { while (it.moveToNext()) o += it.getString(0) }
        return o
    }

    fun todos(): List<Todo> {
        val c = readableDatabase.rawQuery(
            "SELECT * FROM todos ORDER BY CASE priority WHEN 'KHẨN CẤP' THEN 0 WHEN 'CAO' THEN 1 ELSE 2 END, due ASC", null
        )
        val o = mutableListOf<Todo>()
        c.use {
            while (it.moveToNext()) o += Todo(
                it.getLong(0), it.getString(1), it.getString(2), it.getString(3),
                it.getString(4), it.getString(5), it.getInt(6), it.getString(7), it.getString(8)
            )
        }
        return o
    }

    fun addTodo(t: Todo) = writableDatabase.insert("todos", null, ContentValues().apply {
        put("title", t.title); put("detail", t.detail); put("related", t.related)
        put("created", t.created); put("due", t.due); put("progress", t.progress)
        put("priority", t.priority); put("status", t.status)
    })

    fun updateTodoStatus(id: Long, status: String, progress: Int) =
        writableDatabase.execSQL("UPDATE todos SET status=?,progress=? WHERE id=?", arrayOf(status, progress, id))

    fun addAttachment(ownerType: String, ownerId: Long, path: String) =
        writableDatabase.insert("attachments", null, ContentValues().apply {
            put("ownerType", ownerType); put("ownerId", ownerId); put("path", path)
        })

    fun personnel(date: String): List<Person> {
        val c = readableDatabase.rawQuery("SELECT * FROM personnel WHERE date=? ORDER BY groupName,name", arrayOf(date))
        val o = mutableListOf<Person>()
        c.use {
            while (it.moveToNext()) o += Person(
                it.getLong(0), it.getString(1), it.getString(2), it.getString(3), it.getString(4), it.getDouble(5)
            )
        }
        return o
    }

    fun addPerson(p: Person) = writableDatabase.insert("personnel", null, ContentValues().apply {
        put("name", p.name); put("groupName", p.groupName); put("shift", p.shift); put("date", p.date); put("ot", p.ot)
    })

    fun updatePersonOt(id: Long, ot: Double) =
        writableDatabase.execSQL("UPDATE personnel SET ot=? WHERE id=?", arrayOf(ot, id))

    fun ot(date: String): List<OtRecord> {
        val c = readableDatabase.rawQuery("SELECT * FROM ot_records WHERE date=? ORDER BY name", arrayOf(date))
        val o = mutableListOf<OtRecord>()
        c.use {
            while (it.moveToNext()) o += OtRecord(
                it.getLong(0), it.getString(1), it.getString(2), it.getDouble(3), it.getString(4), it.getString(5)
            )
        }
        return o
    }

    fun addOt(x: OtRecord) = writableDatabase.insert("ot_records", null, ContentValues().apply {
        put("date", x.date); put("name", x.name); put("hours", x.hours); put("reason", x.reason); put("status", x.status)
    })

    fun updateOt(id: Long, status: String) =
        writableDatabase.execSQL("UPDATE ot_records SET status=? WHERE id=?", arrayOf(status, id))

    fun amh(date: String): List<AmhRecord> {
        val c = readableDatabase.rawQuery("SELECT * FROM amh_records WHERE date=? ORDER BY code", arrayOf(date))
        val o = mutableListOf<AmhRecord>()
        c.use {
            while (it.moveToNext()) o += AmhRecord(it.getLong(0), it.getString(1), it.getString(2), it.getInt(3), it.getString(4))
        }
        return o
    }

    fun addAmh(x: AmhRecord) = writableDatabase.insert("amh_records", null, ContentValues().apply {
        put("date", x.date); put("code", x.code); put("qty", x.qty); put("note", x.note)
    })

    fun shipments(date: String): List<Shipment> {
        val c = readableDatabase.rawQuery("SELECT * FROM shipments WHERE date=? ORDER BY status,code", arrayOf(date))
        val o = mutableListOf<Shipment>()
        c.use {
            while (it.moveToNext()) o += Shipment(
                it.getLong(0), it.getString(1), it.getString(2), it.getString(3), it.getInt(4), it.getString(5), it.getString(6)
            )
        }
        return o
    }

    fun addShipment(x: Shipment) = writableDatabase.insert("shipments", null, ContentValues().apply {
        put("date", x.date); put("code", x.code); put("invoice", x.invoice); put("qty", x.qty); put("status", x.status); put("note", x.note)
    })

    fun updateShipment(id: Long, status: String) =
        writableDatabase.execSQL("UPDATE shipments SET status=? WHERE id=?", arrayOf(status, id))

    fun data(date: String): List<DataRecord> {
        val c = readableDatabase.rawQuery("SELECT * FROM data_records WHERE date=? ORDER BY status,code", arrayOf(date))
        val o = mutableListOf<DataRecord>()
        c.use {
            while (it.moveToNext()) o += DataRecord(
                it.getLong(0), it.getString(1), it.getString(2), it.getString(3), it.getInt(4), it.getString(5), it.getString(6)
            )
        }
        return o
    }

    fun addData(x: DataRecord) = writableDatabase.insert("data_records", null, ContentValues().apply {
        put("date", x.date); put("code", x.code); put("design", x.design); put("qty", x.qty); put("status", x.status); put("note", x.note)
    })

    fun lots(date: String): List<LotRecord> {
        val c = readableDatabase.rawQuery("SELECT * FROM lots WHERE date=? ORDER BY status", arrayOf(date))
        val o = mutableListOf<LotRecord>()
        c.use {
            while (it.moveToNext()) o += LotRecord(
                it.getLong(0), it.getString(1), it.getString(2), it.getString(3), it.getString(4), it.getString(5), it.getString(6)
            )
        }
        return o
    }

    fun addLot(x: LotRecord) = writableDatabase.insert("lots", null, ContentValues().apply {
        put("date", x.date); put("lot", x.lot); put("code", x.code); put("status", x.status); put("emailTo", x.emailTo); put("note", x.note)
    })

    fun mails(date: String): List<MailRecord> {
        val c = readableDatabase.rawQuery("SELECT * FROM mail_records WHERE date=? ORDER BY subject", arrayOf(date))
        val o = mutableListOf<MailRecord>()
        c.use {
            while (it.moveToNext()) o += MailRecord(
                it.getLong(0), it.getString(1), it.getString(2), it.getString(3), it.getString(4), it.getString(5)
            )
        }
        return o
    }

    fun addMail(x: MailRecord) = writableDatabase.insert("mail_records", null, ContentValues().apply {
        put("date", x.date); put("subject", x.subject); put("sender", x.sender); put("status", x.status); put("note", x.note)
    })
}
