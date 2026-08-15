-- شغّل هذا السكربت مرة واحدة من: لوحة تحكم Supabase > SQL Editor > New query

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,           -- معرّف رئيس الموقع (session.ownerId) المرتبط بهذا الجهاز
  endpoint text not null unique,    -- عنوان اشتراك Push الفريد لهذا الجهاز/المتصفح
  p256dh text not null,
  auth text not null,
  device_label text,                -- وصف اختياري للجهاز (نوع المتصفح مثلاً)
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_owner_id_idx on public.push_subscriptions (owner_id);

alter table public.push_subscriptions enable row level security;

-- ملاحظة أمان: هذا المشروع يستخدم مفتاح anon فقط بدون Supabase Auth (نفس أسلوب
-- جدول warehouse_state الموجود عندك)، لذلك السياسة هنا مفتوحة بنفس المنطق.
-- إن رغبت بتشديدها لاحقاً، اربطها بعمود owner_id مقارنةً بجلسة موثوقة.
drop policy if exists "public full access" on public.push_subscriptions;
create policy "public full access"
  on public.push_subscriptions
  for all
  using (true)
  with check (true);
