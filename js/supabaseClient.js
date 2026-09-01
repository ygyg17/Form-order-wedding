/**
 * ============================================================
 *  SUPABASE CLIENT
 * ============================================================
 *  SUPABASE_ANON_KEY di bawah ini AMAN untuk ditaruh di frontend
 *  (public), SELAMA Row Level Security (RLS) sudah diaktifkan
 *  dengan benar di tabel `orders` (lihat supabase/schema.sql).
 *
 *  JANGAN PERNAH menaruh Service Role Key di file ini atau di
 *  file apapun yang di-push ke GitHub. Service Role Key hanya
 *  boleh berada di Supabase Edge Function secrets.
 * ============================================================
 */

const SUPABASE_URL = "https://iczzdpqewabppbolctpc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljenpkcHFld2FicHBib2xjdHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTc2NTQsImV4cCI6MjEwMzgzMzY1NH0.s-HI9LyU4sCfavVKShD4DdDJX1m5Yz1_m7VDHjkVupo";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});
