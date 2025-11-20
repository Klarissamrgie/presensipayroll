export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tbgrade: {
        Row: {
          id_grade: number
          name_grade: string
          harga_grade: number | null
        }
        Insert: {
          id_grade?: number
          name_grade: string
          harga_grade?: number | null
        }
        Update: {
          id_grade?: number
          name_grade?: string
          harga_grade?: number | null
        }
      }
      tbKelas: {
        Row: {
          id_kelas: number
          name_kelas: string | null
          id_grade: number | null
        }
        Insert: {
          id_kelas?: number
          name_kelas?: string | null
          id_grade?: number | null
        }
        Update: {
          id_kelas?: number
          name_kelas?: string | null
          id_grade?: number | null
        }
      }
      tbStudents: {
        Row: {
          id_student: number
          name_student: string
          gender_student: string | null
          id_kelas: number | null
          datebirth_student: string | null
          joindate_student: string | null
          id_grade: number
        }
        Insert: {
          id_student?: number
          name_student: string
          gender_student?: string | null
          id_kelas?: number | null
          datebirth_student?: string | null
          joindate_student?: string | null
          id_grade: number
        }
        Update: {
          id_student?: number
          name_student?: string
          gender_student?: string | null
          id_kelas?: number | null
          datebirth_student?: string | null
          joindate_student?: string | null
          id_grade?: number
        }
      }
      tbTeacher: {
        Row: {
          id_teacher: string
          nama: string | null
          gender: string | null
          id_kelas: number | null
          tgl_lahir: string | null
          join_date: string | null
          npwp: string | null
          nama_bank: string | null
          nomor_rekening: string | null
          email: string | null
        }
        Insert: {
          id_teacher: string
          nama?: string | null
          gender?: string | null
          id_kelas?: number | null
          tgl_lahir?: string | null
          join_date?: string | null
          npwp?: string | null
          nama_bank?: string | null
          nomor_rekening?: string | null
          email?: string | null
        }
        Update: {
          id_teacher?: string
          nama?: string | null
          gender?: string | null
          id_kelas?: number | null
          tgl_lahir?: string | null
          join_date?: string | null
          npwp?: string | null
          nama_bank?: string | null
          nomor_rekening?: string | null
          email?: string | null
        }
      }
      tbKegiatan: {
        Row: {
          id_kegiatan: number
          nama_kegiatan: string
          tgl_kegiatan: string | null
          jam_kegiatan: string | null
          lokasi_kegiatan: string | null
          hrg_kegiatan: number | null
          id_teacher: string | null
          id_student: number | null
          id_kelas: number | null
        }
        Insert: {
          id_kegiatan?: number
          nama_kegiatan: string
          tgl_kegiatan?: string | null
          jam_kegiatan?: string | null
          lokasi_kegiatan?: string | null
          hrg_kegiatan?: number | null
          id_teacher?: string | null
          id_student?: number | null
          id_kelas?: number | null
        }
        Update: {
          id_kegiatan?: number
          nama_kegiatan?: string
          tgl_kegiatan?: string | null
          jam_kegiatan?: string | null
          lokasi_kegiatan?: string | null
          hrg_kegiatan?: number | null
          id_teacher?: string | null
          id_student?: number | null
          id_kelas?: number | null
        }
      }
      tbPayroll: {
        Row: {
          id_payroll: number
          id_student: number | null
          id_kegiatan: number | null
          id_grade: number | null
          tanggal_payroll: string | null
          total_payroll: number | null
          pph21_payroll: number | null
          id_teacher: string | null
        }
        Insert: {
          id_payroll?: number
          id_student?: number | null
          id_kegiatan?: number | null
          id_grade?: number | null
          tanggal_payroll?: string | null
          total_payroll?: number | null
          pph21_payroll?: number | null
          id_teacher?: string | null
        }
        Update: {
          id_payroll?: number
          id_student?: number | null
          id_kegiatan?: number | null
          id_grade?: number | null
          tanggal_payroll?: string | null
          total_payroll?: number | null
          pph21_payroll?: number | null
          id_teacher?: string | null
        }
      }
      tbTipePresensi: {
        Row: {
          id_tipe_presensi: number
          nama: string | null
        }
        Insert: {
          id_tipe_presensi?: number
          nama?: string | null
        }
        Update: {
          id_tipe_presensi?: number
          nama?: string | null
        }
      }
      tbPresensi: {
        Row: {
          id_presensi: number
          id_kegiatan: number | null
          id_student: number | null
          tanggal_presensi: string | null
          jam_presensi: string | null
          id_teacher: string | null
          id_jenis_presensi: number | null
          image_kehadiran: string | null
        }
        Insert: {
          id_presensi?: number
          id_kegiatan?: number | null
          id_student?: number | null
          tanggal_presensi?: string | null
          jam_presensi?: string | null
          id_teacher?: string | null
          id_jenis_presensi?: number | null
          image_kehadiran?: string | null
        }
        Update: {
          id_presensi?: number
          id_kegiatan?: number | null
          id_student?: number | null
          tanggal_presensi?: string | null
          jam_presensi?: string | null
          id_teacher?: string | null
          id_jenis_presensi?: number | null
          image_kehadiran?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}