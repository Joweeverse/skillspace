import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await context.params
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignored when called in route handlers if headers are already sent
            }
          },
        },
      }
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 })
    }

    // 1. Dapatkan data kursus menggunakan supabaseAdmin untuk cek kepemilikan
    const { data: course, error: fetchErr } = await supabaseAdmin
      .from('courses')
      .select('id, mentor_id, cover_url')
      .eq('id', courseId)
      .single()

    if (fetchErr || !course) {
      return NextResponse.json({ error: 'Kursus tidak ditemukan.' }, { status: 404 })
    }

    // 2. Pastikan yang menghapus adalah mentor pemilik kursus atau admin
    const userRole = user.user_metadata?.role
    if (course.mentor_id !== user.id && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak akses untuk menghapus kursus ini.' },
        { status: 403 }
      )
    }

    // 3. Bersihkan data anak (certificates, enrollments, lessons, quizzes, questions, discussions)
    await supabaseAdmin.from('certificates').delete().eq('course_id', courseId)
    await supabaseAdmin.from('enrollments').delete().eq('course_id', courseId)

    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)

    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        const { data: quizzes } = await supabaseAdmin
          .from('quizzes')
          .select('id')
          .eq('lesson_id', lesson.id)

        if (quizzes && quizzes.length > 0) {
          for (const q of quizzes) {
            await supabaseAdmin.from('questions').delete().eq('quiz_id', q.id)
            await supabaseAdmin.from('quizzes').delete().eq('id', q.id)
          }
        }
        await supabaseAdmin.from('discussions').delete().eq('lesson_id', lesson.id)
        await supabaseAdmin.from('lessons').delete().eq('id', lesson.id)
      }
    }

    // 4. Hapus cover dari storage jika tersimpan di course-covers
    if (course.cover_url?.includes('/course-covers/')) {
      const prevPath = course.cover_url.split('/course-covers/')[1]?.split('?')[0]
      if (prevPath) {
        await supabaseAdmin.storage.from('course-covers').remove([prevPath]).catch(() => {})
      }
    }

    // 5. Hapus kursus dari tabel courses
    const { error: deleteErr } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
