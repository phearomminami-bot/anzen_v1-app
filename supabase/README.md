# Anzen — Supabase backend setup

ការដំឡើង Database ពិតប្រាកដសម្រាប់ Anzen ដើម្បីឱ្យ admin / គ្រូ / សិស្ស
ប្រើរួមគ្នា និង sync គ្រប់ឧបករណ៍។ (Real cloud database — shared, multi-user.)

> ✅ Schema និង security ទាំងអស់នេះត្រូវបាន **test ជាមួយ PostgreSQL ពិត** រួចហើយ
> (admin ឃើញទាំងអស់ · គ្រូឃើញតែសិស្សខ្លួន · សិស្សឃើញតែទិន្នន័យខ្លួនឯង)។

---

## ឯកសារ (run តាមលំដាប់)

| លំដាប់ | File | ធ្វើអ្វី |
|---|---|---|
| 1 | `01_schema.sql`  | បង្កើត tables ទាំងអស់ (students, lessons, invoices, vehicles, …) |
| 2 | `02_helpers.sql` | functions (role, is_admin…) + trigger បង្កើត profile ពេល signup |
| 3 | `03_rls.sql`     | Row Level Security — នរណាឃើញ/កែអ្វីបាន |

---

## ជំហានដំឡើង (Setup steps)

### 1. បង្កើត Supabase project
- ចូល <https://supabase.com> → **New project**
- ដាក់ឈ្មោះ (ឧ. `anzen`), ជ្រើស region ជិត (Singapore), កំណត់ DB password
- រង់ចាំ ~2 នាទី

### 2. Run SQL ទាំង ៣
- បើក **SQL Editor** (ម៉ឺនុយខាងឆ្វេង) → **New query**
- Copy មាតិកា `01_schema.sql` ដាក់ → **Run**
- ធ្វើដូចគ្នាសម្រាប់ `02_helpers.sql` ហើយ `03_rls.sql` (តាមលំដាប់)
- គ្មាន error = ជោគជ័យ ✓

### 3. បង្កើត Storage buckets (សម្រាប់រូបថត / logo)
- ម៉ឺនុយ **Storage** → **New bucket**
  - `logos` (public)
  - `photos` (public ឬ private តាមការចង់)
- វីដេអូមេរៀន — នៅប្រើ **YouTube** ដដែល (មិនបាច់ upload)

### 4. បង្កើតគណនី Admin ដំបូង
- ម៉ឺនុយ **Authentication → Users → Add user** (email + password)
- បន្ទាប់មក SQL Editor run៖
  ```sql
  update profiles set role = 'admin'
  where id = (select id from auth.users where email = 'អ៊ីមែលរបស់អ្នក');
  ```
- ឥឡូវគណនីនេះជា admin ពេញសិទ្ធិ។

### 5. យក API keys (សម្រាប់ភ្ជាប់ App ពេលក្រោយ)
- **Project Settings → API**
  - `Project URL`  — ឧ. `https://abcd.supabase.co`
  - `anon public key` — ប្រើក្នុង frontend (មិនមែន secret)
  - ⚠️ `service_role key` — **កុំ**ដាក់ក្នុង frontend (server only)

---

## របៀបដែល login ដំណើរការ

```
auth.users (Supabase Auth)  ──┐
                              │  trigger បង្កើតស្វ័យប្រវត្តិ
profiles { role, linked_id } ◄┘   role = admin | instructor | student
   │                              linked_id = 'I-01' ឬ 'S-1'
   └─► ភ្ជាប់ទៅ instructors / students record
```

- **admin** → ឃើញ/កែទាំងអស់
- **instructor** → ឃើញសិស្ស​របស់​ខ្លួន, គ្រប់គ្រងមេរៀន​ខ្លួន, ពិនិត្យយានយន្ត
- **student** → ឃើញតែ record ខ្លួនឯង, មេរៀន, វិក្កយបត្រ, វឌ្ឍនភាព

ដើម្បីបង្កើតគណនីគ្រូ/សិស្ស ភ្ជាប់នឹង record មាន​ស្រាប់ — ដាក់ metadata ពេល signup៖
```json
{ "role": "instructor", "full_name": "ស៊ុំ វិច្ឆេយ្យ", "linked_id": "I-01" }
```
(ឬ admin កំណត់ `linked_id` ក្រោយក្នុង table `profiles`។)

---

## ✅ ផ្នែកទី ១ រួចរាល់ — Login ពិត (Supabase Auth)

App ឥឡូវមាន **login ពិត** ភ្ជាប់នឹង Supabase។ ដើម្បីបើកដំណើរការ៖

1. បើក `Anzen.html` ដោយ text editor → រកប្លុកនេះក្នុង `<head>`៖
   ```html
   <script>
     window.__ANZEN_SUPABASE = {
       url:     'https://YOUR-PROJECT.supabase.co',
       anonKey: 'YOUR-ANON-PUBLIC-KEY'
     };
   </script>
   ```
2. ប្ដូរ `YOUR-PROJECT…` និង `YOUR-ANON-PUBLIC-KEY` ជា **Project URL** និង
   **anon public key** ពិត (Supabase → Settings → API)។
3. Save → upload ទៅ Netlify ឡើងវិញ។

**លទ្ធផល៖**
- បើដាក់ creds ពិត → បង្ហាញ **login screen ពិត** (email + password)។ តួនាទី
  (admin/គ្រូ/សិស្ស) យកពី `profiles` ស្វ័យប្រវត្តិ។
- បើទុក placeholder `YOUR-…` ដដែល → ប្រើ **Demo mode** ដូចចាស់ (សម្រាប់សាកល្បង)។
- Session ត្រូវចងចាំ — reload មិនបាច់ login ឡើងវិញ។

> ⚠️ បានតេស្ត៖ admin→dashboard · password ខុស→error · សិស្ស→routed តាម linked_id ·
> demo fallback នៅដំណើរការ។

## ✅ ផ្នែកទី ២ រួចរាល់ — ភ្ជាប់ទិន្នន័យ + ផ្ទេរទិន្នន័យចាស់

App ឥឡូវ **load/save ទិន្នន័យ​ពិត​ពី Supabase**៖
- ពេល **login** → ទាញ​ទិន្នន័យ​ទាំង​អស់​ពី cloud (សិស្ស, មេរៀន, វិក្កយបត្រ, ការ​កំណត់…)
- ពេល **កែ/បន្ថែម** → រក្សា​ទុក​ឡើង cloud ស្វ័យ​ប្រវត្តិ (debounced) → sync គ្រប់​ឧបករណ៍
- បើ​មិន​ភ្ជាប់ cloud → ប្រើ localStorage ដូច​ចាស់ (offline)

### 🚚 ផ្ទេរ​ទិន្នន័យ​ចាស់ (ធ្វើ​ម្ដង)

នៅ​លើ **ឧបករណ៍​ដែល​មាន​ទិន្នន័យ​ចាស់** (browser ដែល​អ្នក​ធ្លាប់​បញ្ចូល​សិស្ស/មេរៀន)៖
1. Login ចូល
2. ទៅ **ការ​កំណត់ → ទិន្នន័យ**
3. នៅ​កាត **Cloud · Supabase** ចុច **⬆️ ផ្ទេរ​ទៅ Cloud**
4. រង់​ចាំ​សារ "បាន​ផ្ទេរ ✓" — ឥឡូវ​ទិន្នន័យ​នៅ​លើ cloud ហើយ

បន្ទាប់​ពី​នោះ ឧបករណ៍​ផ្សេង (tablet, ទូរស័ព្ទ) ពេល login នឹង​ឃើញ​ទិន្នន័យ​ដូច​គ្នា។
បើ​ចង់​ទាញ​ទិន្នន័យ​ចុង​ក្រោយ​ពី cloud ម្ដង​ទៀត → **⬇️ ទាញ​ពី Cloud**។

> ⚠️ បាន​តេស្ត​ពេញលេញ៖ login→load · push→upload · auto-sync→cloud · offline fallback។

### 🔗 បង្កើត​គណនី​គ្រូ/សិស្ស — ពី​ក្នុង App (ងាយ)

Admin អាច​បង្កើត​គណនី login ឱ្យ​គ្រូ/សិស្ស **ដោយ​មិន​បាច់​ចូល Supabase**៖
**ការ​កំណត់ → គណនី​ចូល (Logins)** → ជ្រើស​គ្រូ/សិស្ស → ដាក់​អ៊ីមែល + ពាក្យ​សម្ងាត់ → **បង្កើត​គណនី**។
ប្រព័ន្ធ​នឹង​ភ្ជាប់​គណនី​ទៅ record នោះ​ដោយ​ស្វ័យ​ប្រវត្តិ (role + linked_id)។

> ⚠️ **សំខាន់ — បិទ Email Confirmation ម្ដង​មុន​គេ៖**
> Supabase → **Authentication → Providers → Email** → បិទ **"Confirm email"** → Save។
> បើ​មិន​បិទ គណនី​ដែល​បង្កើត​ត្រូវ​ការ​បញ្ជាក់​អ៊ីមែល​មុន​ពេល login (សិស្ស​ប្រហែល​គ្មាន​អ៊ីមែល)។
> បើ​សិស្ស​គ្មាន​អ៊ីមែល → ប្រើ username បែប `s1@anzen.local`។

នេះ​បញ្ចប់​ការ​ប្ដូរ​ទៅ​ប្រព័ន្ធ​ពិត​ប្រាកដ 🎉

---

### តារាងទាំងអស់ (reference)

`profiles` · `instructors` · `students` · `vehicles` · `lessons` ·
`invoices` · `staff` · `lesson_progress` · `vehicle_inspections` ·
`lesson_content` · `attendance` · `announcements` · `notifications` ·
`school_settings`

រាល់ table មាន column `extra jsonb` — ស្រូបយក field ណាដែលមិនទាន់មាន column
(មិនបាច់ប្ដូរ schema ពេល app បន្ថែម field ថ្មី)។
