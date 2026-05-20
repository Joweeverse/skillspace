import { createClient } from '@/lib/supabase'
import { Certificate } from '@/types/database'
import { jsPDF } from 'jspdf'

const supabase = createClient()

export const CertificateService = {
  // ... (existing methods)

  async downloadCertificatePDF(
    cert: Certificate | null, 
    courseTitle: string, 
    studentName: string,
    courseId: string
  ) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4'
    })

    const width = doc.internal.pageSize.getWidth()
    const height = doc.internal.pageSize.getHeight()

    // 1. Add Background (Custom Template or Default)
    if (cert?.template_url) {
      try {
        // We use a proxy or fetch to get the image data and bypass cache with timestamp
        const cacheBusterUrl = `${cert.template_url}?t=${Date.now()}`
        const img = new Image()
        img.crossOrigin = "Anonymous"
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = cacheBusterUrl
        })

        doc.addImage(img, 'JPEG', 0, 0, width, height)
      } catch (err) {
        console.error("Failed to load custom template, falling back to default", err)
        // Fallback to default border if image fails
        doc.setFillColor(255, 255, 255)
        doc.rect(0, 0, width, height, 'F')
        doc.setDrawColor(cert?.primary_color || '#2563eb')
        doc.setLineWidth(20)
        doc.rect(10, 10, width - 20, height - 20, 'S')
      }
    } else {
      // Default Professional Border
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, width, height, 'F')
      doc.setDrawColor(cert?.primary_color || '#2563eb')
      doc.setLineWidth(20)
      doc.rect(10, 10, width - 20, height - 20, 'S')
    }

    // 2. Add Content Layers (Z-index 10 logic)
    // Add Watermark
    doc.setTextColor(240, 240, 240)
    doc.setFontSize(60)
    doc.text('SkillSpace', width - 40, 40, { angle: -20, align: 'right' })

    // Add Icon
    doc.setTextColor(cert?.primary_color || '#2563eb')
    doc.setFontSize(60)
    doc.text('★', width / 2, 70, { align: 'center' })

    // Add Title
    doc.setTextColor(cert?.primary_color || '#2563eb')
    doc.setFontSize(40)
    doc.setFont('helvetica', 'bold')
    doc.text(cert?.title_text || 'SERTIFIKAT KELULUSAN', width / 2, 110, { align: 'center' })

    // Add Description
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(cert?.description_text || 'Dengan ini menyatakan bahwa', width / 2, 140, { align: 'center' })

    // Add Name
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(48)
    doc.setFont('times', 'italic')
    doc.text(studentName || 'Siswa SkillSpace', width / 2, 185, { align: 'center' })

    // Horizontal line under name
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(1)
    doc.line(width / 2 - 150, 195, width / 2 + 150, 195)

    // Add Course
    doc.setFontSize(16)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(`Telah berhasil menyelesaikan seluruh kurikulum pada kursus:`, width / 2, 225, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(`"${courseTitle}"`, width / 2, 250, { align: 'center' })

    // Add Footer Info
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.text(`ID SERTIFIKAT: SS-${courseId.slice(0,8).toUpperCase()}`, 60, height - 60)
    doc.text(`TANGGAL TERBIT: ${new Date().toLocaleDateString('id-ID')}`, 60, height - 48)

    // Add Signature
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(18)
    doc.setFont('times', 'italic')
    doc.text(cert?.signature_name || 'Mentor SkillSpace', width - 60, height - 70, { align: 'right' })
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(1)
    doc.line(width - 200, height - 65, width - 60, height - 65)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('MENTOR PENGAJAR', width - 60, height - 50, { align: 'right' })

    doc.save(`Sertifikat-${courseTitle}.pdf`)
  },
  async getCertificateByCourseId(courseId: string): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('course_id', courseId)
      .maybeSingle()

    if (error) throw error
    return data as Certificate
  },

  async saveCertificate(cert: Omit<Certificate, 'id' | 'created_at'>) {
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('course_id', cert.course_id)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('certificates')
        .update({
          ...cert,
          created_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data as Certificate
    } else {
      const { data, error } = await supabase
        .from('certificates')
        .insert(cert)
        .select()
        .single()
      if (error) throw error
      return data as Certificate
    }
  },

  async uploadTemplate(courseId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${courseId}-${Date.now()}.${fileExt}`
    const filePath = `templates/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath)

    return publicUrl
  }
}
