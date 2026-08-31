package com.congviechangngay.pro

import android.content.Context
import android.content.Intent
import android.net.Uri
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

fun elapsed(start: Long, end: Long): String {
    val mins = ((end - start) / 60_000).coerceAtLeast(0)
    return "thực tế $mins phút"
}

fun shareText(ctx: Context, text: String) {
    val i = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
    }
    ctx.startActivity(Intent.createChooser(i, "Chia sẻ"))
}

fun sendEmail(ctx: Context, to: String, subject: String, body: String) {
    val i = Intent(Intent.ACTION_SENDTO).apply {
        data = Uri.parse("mailto:")
        putExtra(Intent.EXTRA_EMAIL, arrayOf(to))
        putExtra(Intent.EXTRA_SUBJECT, subject)
        putExtra(Intent.EXTRA_TEXT, body)
    }
    try { ctx.startActivity(i) } catch (_: Exception) { shareText(ctx, body) }
}
