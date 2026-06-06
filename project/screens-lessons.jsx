// screens-lessons.jsx — Student Lessons (Japanese 自動車教習所 standard curriculum)
// Structure: 第一段階 (Stage 1 · school course) → 第二段階 (Stage 2 · public road)
// Theory 学科 1–26 · Practical 技能 (AT 12h / MT 15h stage1, 19h stage2) · Exam milestones

// ── THEORY 学科教習 ──────────────────────────────────────────────────────────
// Stage 1: 学科 1–10 (provisional license / 仮免許)  ·  Stage 2: 学科 11–26 (full license / 本免許)
const THEORY_TEXTS = [
  // ───────── 第一段階 (Stage 1) ─────────
  {
    id:'tt-01', no:'学科1', ja:'運転者の心得', stage:1, mins:10,
    km:'ចិត្តគំនិតរបស់អ្នកបើកបរ', en:"Driver's Mindset",
    body_km:`មេរៀនទីមួយជាមូលដ្ឋាននៃការបើកបរប្រកបដោយសុវត្ថិភាព (安全運転)។

**គោលការណ៍សំខាន់:**
• ការបើកបរ គឺជាការទទួលខុសត្រូវចំពោះជីវិតមនុស្ស
• គោរព "បើកបរការពារ" (だろう運転 ❌ → かもしれない運転 ✓) — សន្មតថាគ្រោះថ្នាក់អាចកើតឡើង
• មិនបើកបរពេលហត់នឿយ ផឹកស្រា ឬប្រើថ្នាំ
• គិតគូរអ្នកដទៃ — ថ្មើរជើង កង់ ម៉ូតូ`,
    body_en:`The first and most important unit — the foundation of safe driving (安全運転).

**Core principles:**
• Driving is a responsibility over human lives
• Practice defensive driving: shift from "it'll be fine" (だろう運転) to "it might happen" (かもしれない運転)
• Never drive when tired, after alcohol, or on medication
• Always consider others — pedestrians, cyclists, motorcyclists`,
  },
  {
    id:'tt-02', no:'学科2', ja:'信号に従うこと', stage:1, mins:8,
    km:'ការគោរពភ្លើងសញ្ញាចរាចរណ៍', en:'Obeying Traffic Signals',
    body_km:`ភ្លើងសញ្ញាចរាចរណ៍ (信号) គ្រប់គ្រងលំហូរនៅចំណុចប្រសព្វ។

**អត្ថន័យពណ៌:**
• 🟢 បៃតង (青) — អាចបន្ត ប៉ុន្តែផ្ដល់អាទិភាពអ្នកថ្មើរជើង
• 🟡 លឿង (黄) — ឈប់ លើកលែងតែជិតពេក
• 🔴 ក្រហម (赤) — ឈប់ពេញលេញ មុនបន្ទាត់ឈប់
• ព្រួញ (矢印) — អនុញ្ញាតតែទិសព្រួញប៉ុណ្ណោះ`,
    body_en:`Traffic signals (信号) control flow at intersections.

**Color meanings:**
• 🟢 Green (青) — may proceed, but yield to pedestrians
• 🟡 Yellow (黄) — stop, unless too close to stop safely
• 🔴 Red (赤) — full stop before the stop line
• Arrow (矢印) — proceed only in the arrow's direction`,
  },
  {
    id:'tt-03', no:'学科3', ja:'標識・標示に従うこと', stage:1, mins:12,
    km:'ការគោរពផ្លាកសញ្ញា និងសញ្ញាសម្គាល់លើផ្លូវ', en:'Obeying Signs & Road Markings',
    body_km:`ផ្លាក (標識) និងសញ្ញាគូសលើផ្លូវ (標示) ប្រាប់ច្បាប់ផ្លូវ។

**ប្រភេទផ្លាក:**
• 規制標識 (បង្គាប់) — ពណ៌ក្រហម/ខៀវ — ត្រូវគោរព (ឈប់, ហាមចូល, ល្បឿន)
• 指示標識 (ណែនាំ) — ផ្ដល់សិទ្ធិ (ផ្លូវអាទិភាព, កន្លែងឆ្លងថ្មើរជើង)
• 警戒標識 (ព្រមាន) — ពណ៌លឿង — គ្រោះថ្នាក់ខាងមុខ
• 案内標識 (ព័ត៌មាន) — ពណ៌បៃតង/ខៀវ — ទិសដៅ`,
    body_en:`Signs (標識) and painted markings (標示) communicate road rules.

**Sign categories:**
• Regulatory (規制) — red/blue — must obey (stop, no entry, speed)
• Instruction (指示) — grant rights (priority road, crossings)
• Warning (警戒) — yellow diamond — hazard ahead
• Guide (案内) — green/blue — directions & info`,
  },
  {
    id:'tt-04', no:'学科4', ja:'車が通行するところ・してはいけないところ', stage:1, mins:10,
    km:'កន្លែងដែលរថយន្តអាច និងមិនអាចធ្វើដំណើរ', en:'Where Vehicles May & May Not Travel',
    body_km:`**ច្បាប់គោល:**
• បើកបរនៅខាងឆ្វេងផ្លូវ (左側通行 — ស្តង់ដាជប៉ុន)
• រក្សាក្នុងគន្លងផ្លូវ (車線)
• ហាមឡើងលើ sidewalk (歩道) លើកលែងពេលចូល/ចេញ
• ហាមឆ្លងបន្ទាត់ពណ៌លឿងស្រឡាយ (黄色の中央線)`,
    body_en:`**Basic rules:**
• Keep to the left side of the road (左側通行 — Japan standard)
• Stay within your lane (車線)
• Never drive on the sidewalk (歩道) except entering/exiting
• Do not cross a solid yellow centre line (黄色の中央線)`,
  },
  {
    id:'tt-05', no:'学科5', ja:'緊急自動車などの優先', stage:1, mins:7,
    km:'អាទិភាពរថយន្តសង្គ្រោះបន្ទាន់', en:'Priority for Emergency Vehicles',
    body_km:`នៅពេលឮសំឡេងរថយន្តសង្គ្រោះ (緊急自動車 — សង្គ្រោះ ពន្លត់អគ្គីភ័យ ប៉ូលិស):

• ផ្ដល់ផ្លូវភ្លាមៗ
• ឈប់ឆ្វេង ឬចេញពីចំណុចប្រសព្វ
• កុំធ្វើតាមភ្លាមៗ ឬប្រណាំង
• រថយន្តក្រុងសាលា (通学バス) ឈប់ → ត្រូវប្រុងប្រយ័ត្ន`,
    body_en:`When you hear an emergency vehicle (緊急自動車 — ambulance, fire, police):

• Yield the way immediately
• Pull to the left or clear the intersection
• Do not follow closely or race
• School buses stopping (通学バス) → slow and stay alert`,
  },
  {
    id:'tt-06', no:'学科6', ja:'交差点などの通行・踏切', stage:1, mins:12,
    km:'ការឆ្លងកាត់ចំណុចប្រសព្វ និងផ្លូវរថភ្លើង', en:'Intersections & Railroad Crossings',
    body_km:`**ចំណុចប្រសព្វ (交差点):**
• ថយល្បឿន មើល ឆ្វេង-ស្ដាំ-ឆ្វេង
• បត់ឆ្វេង — ដិតផ្លូវឆ្វេង; បត់ស្ដាំ — ឆ្លងក្រោយផ្ដល់អាទិភាព

**ផ្លូវរថភ្លើង (踏切):**
• ឈប់ពេញលេញ មុនឆ្លងជានិច្ច (一時停止)
• បើកបង្អួច ស្ដាប់សំឡេង
• មិនចូល បើគ្មានកន្លែងចេញរួច`,
    body_en:`**Intersections (交差点):**
• Slow down, look left-right-left
• Left turn — hug the left; right turn — yield to oncoming traffic

**Railroad crossings (踏切):**
• Always come to a full stop before crossing (一時停止)
• Open your window and listen
• Do not enter unless there is room to clear it`,
  },
  {
    id:'tt-07', no:'学科7', ja:'安全な速度と車間距離', stage:1, mins:10,
    km:'ល្បឿនសុវត្ថិភាព និងគម្លាតរវាងរថយន្ត', en:'Safe Speed & Following Distance',
    body_km:`**ល្បឿន (速度):**
• គោរពល្បឿនកំណត់ (法定速度 / 規制速度)
• បន្ថយល្បឿនពេលភ្លៀង អ័ព្ទ ផ្លូវកោង

**គម្លាត (車間距離):**
• ចម្ងាយឈប់ = ចម្ងាយប្រតិកម្ម + ចម្ងាយហ្វ្រាំង (空走距離+制動距離)
• ច្បាប់ "៣ វិនាទី" — រក្សាគម្លាតយ៉ាងតិច`,
    body_en:`**Speed (速度):**
• Obey posted and legal limits (法定速度 / 規制速度)
• Reduce speed in rain, fog, and on curves

**Following distance (車間距離):**
• Stopping distance = reaction distance + braking distance (空走距離+制動距離)
• Keep at least a "3-second" gap`,
  },
  {
    id:'tt-08', no:'学科8', ja:'歩行者の保護など', stage:1, mins:9,
    km:'ការការពារអ្នកថ្មើរជើង', en:'Protecting Pedestrians',
    body_km:`អ្នកថ្មើរជើង (歩行者) ជាអ្នកប្រើផ្លូវខ្សោយជាងគេ — ត្រូវការពារ។

• ឈប់ផ្ដល់ផ្លូវ នៅកន្លែងឆ្លង (横断歩道)
• បន្ថយល្បឿនពេលឆ្លងកាត់កុមារ ឬចាស់ជរា
• ការពារ "ការ៉េសុវត្ថិភាព" ពេលឆ្លងផ្លូវសើម (泥はね防止)
• ប្រុងប្រយ័ត្នជិតសាលា មន្ទីរពេទ្យ`,
    body_en:`Pedestrians (歩行者) are the most vulnerable road users — protect them.

• Stop and yield at crossings (横断歩道)
• Slow near children and elderly
• Avoid splashing on wet roads (泥はね防止)
• Extra care near schools and hospitals`,
  },
  {
    id:'tt-09', no:'学科9', ja:'安全に運転できない場合', stage:1, mins:8,
    km:'ករណីដែលមិនអាចបើកបរដោយសុវត្ថិភាព', en:'When You Cannot Drive Safely',
    body_km:`ស្ថានភាពហាមបើកបរ:

• ស្រវឹង (飲酒運転) — ហាមដាច់ខាត ទោសធ្ងន់
• ហត់នឿយ ងងុយដេក (過労運転)
• ប្រើថ្នាំធ្វើឱ្យងងុយគេង
• ប្រើទូរស័ព្ទ (ながら運転) — ហាម`,
    body_en:`Situations where driving is prohibited:

• Drunk driving (飲酒運転) — strictly forbidden, severe penalty
• Fatigue / drowsiness (過労運転)
• Medication causing drowsiness
• Phone / distracted driving (ながら運転) — forbidden`,
  },
  {
    id:'tt-10', no:'学科10', ja:'運転免許制度・適性検査', stage:1, mins:7,
    km:'ប្រព័ន្ធប័ណ្ណបើកបរ និងការត្រួតពិនិត្យសមត្ថភាព', en:'License System & Aptitude',
    body_km:`**ប្រព័ន្ធប័ណ្ណ (免許制度):**
• ប្រភេទប័ណ្ណ (普通 / 準中型 / 大型 …)
• ប័ណ្ណបណ្ដោះអាសន្ន (仮免許) → ប័ណ្ណពេញ (本免許)

**ការត្រួតពិនិត្យសមត្ថភាព (適性検査):**
• មើល (視力), ពណ៌ (色覚), ស្ដាប់ (聴力)
• ប្រតិកម្ម និងសតិអារម្មណ៍`,
    body_en:`**License system (免許制度):**
• License classes (普通 / 準中型 / 大型 …)
• Provisional (仮免許) → Full license (本免許)

**Aptitude test (適性検査):**
• Vision (視力), colour (色覚), hearing (聴力)
• Reaction time and temperament`,
  },

  // ───────── 第二段階 (Stage 2) ─────────
  {
    id:'tt-11', no:'学科11', ja:'死角と運転', stage:2, mins:9,
    km:'ចំណុចងងឹត (Blind Spot) និងការបើកបរ', en:'Blind Spots & Driving',
    body_km:`ចំណុចងងឹត (死角) ជាតំបន់ដែលភ្នែក និងកញ្ចក់មើលមិនឃើញ។

• ពិនិត្យកញ្ចក់ + បែរក្បាលមើល (目視) មុនប្ដូរគន្លង
• ប្រុងប្រយ័ត្ន ម៉ូតូ កង់ ដែលលាក់ក្នុង死角
• រថយន្តធំ មាន死角ធំជាង — កុំនៅជិត`,
    body_en:`Blind spots (死角) are areas mirrors and eyes cannot see.

• Check mirrors + turn head to look (目視) before changing lanes
• Watch for motorcycles/cyclists hidden in blind spots
• Large vehicles have bigger blind spots — keep clear`,
  },
  {
    id:'tt-12', no:'学科12', ja:'適性に応じた運転', stage:2, mins:7,
    km:'ការបើកបរស្របតាមលក្ខណៈផ្ទាល់ខ្លួន', en:'Driving Suited to Your Aptitude',
    body_km:`ស្គាល់ខ្លួនឯង — ចំណុចខ្លាំង/ខ្សោយក្នុងការបើកបរ:

• វិភាគលទ្ធផល適性検査
• ប្រុងប្រយ័ត្នជាងធម្មតា ចំពោះចំណុចខ្សោយ
• គ្រប់គ្រងអារម្មណ៍ (感情のコントロール) — កុំខឹង`,
    body_en:`Know yourself — your driving strengths and weaknesses:

• Review your aptitude-test results
• Take extra care with your weak points
• Control your emotions (感情のコントロール) — avoid road rage`,
  },
  {
    id:'tt-13', no:'学科13', ja:'人間の能力と運転', stage:2, mins:8,
    km:'សមត្ថភាពមនុស្ស និងការបើកបរ', en:'Human Ability & Driving',
    body_km:`កំណត់នៃរាងកាយមនុស្ស ប៉ះពាល់ការបើកបរ:

• ការមើល (視覚) — ៩០% នៃព័ត៌មាន
• Tunnel vision ពេលល្បឿនលឿន (速度と視野)
• ការសម្របភ្នែកពេលងងឹត (暗順応)
• ភាពអស់កម្លាំង បន្ថយការផ្ដោតអារម្មណ៍`,
    body_en:`Human physical limits affect driving:

• Vision (視覚) — 90% of driving information
• Tunnel vision at high speed (速度と視野)
• Eye adaptation in darkness (暗順応)
• Fatigue reduces concentration`,
  },
  {
    id:'tt-14', no:'学科14', ja:'車に働く自然の力と運転', stage:2, mins:9,
    km:'កម្លាំងធម្មជាតិលើរថយន្ត', en:'Natural Forces Acting on a Vehicle',
    body_km:`រូបវិទ្យានៃការបើកបរ:

• កម្លាំងផ្ចិតចេញ (遠心力) — កើនតាមការ៉េល្បឿន នៅផ្លូវកោង
• ចម្ងាយហ្វ្រាំង កើនតាមការ៉េល្បឿន (制動距離 ∝ 速度²)
• Hydroplaning (ハイドロプレーニング) លើផ្លូវសើម
• កម្លាំងប៉ះទង្គិច (衝撃力) កើនយ៉ាងខ្លាំង`,
    body_en:`The physics of driving:

• Centrifugal force (遠心力) — grows with speed² on curves
• Braking distance grows with speed² (制動距離 ∝ 速度²)
• Hydroplaning (ハイドロプレーニング) on wet roads
• Impact force (衝撃力) rises sharply with speed`,
  },
  {
    id:'tt-15', no:'学科15', ja:'悪条件下での運転', stage:2, mins:10,
    km:'ការបើកបរក្នុងលក្ខខណ្ឌអាក្រក់', en:'Driving in Adverse Conditions',
    body_km:`**ភ្លៀង (雨):** បន្ថយល្បឿន បើកភ្លើង រក្សាគម្លាត
**អ័ព្ទ (霧):** ភ្លើងអ័ព្ទ (フォグランプ) មិនបើកភ្លើងធំ
**យប់ (夜間):** ប្ដូរភ្លើងធំ/តូច (ハイ・ロービーム)
**ខ្យល់ខ្លាំង/ផ្លូវកក:** គ្រប់គ្រងចង្កូតថ្នមៗ`,
    body_en:`**Rain (雨):** slow down, lights on, keep distance
**Fog (霧):** use fog lamps (フォグランプ), not high beams
**Night (夜間):** switch high/low beams (ハイ・ロービーム)
**Strong wind / icy road:** steer gently and smoothly`,
  },
  {
    id:'tt-16', no:'学科16', ja:'特徴的な事故と悲惨さ', stage:2, mins:8,
    km:'គ្រោះថ្នាក់ធម្មតា និងផលវិបាក', en:'Typical Accidents & Their Tragedy',
    body_km:`ស្គាល់គ្រោះថ្នាក់ញឹកញាប់ ដើម្បីបង្ការ:

• គ្រោះថ្នាក់បត់ស្ដាំ/ឆ្វេង (右左折事故)
• បុកពីក្រោយ (追突) — គម្លាតមិនគ្រប់គ្រាន់
• គ្រោះថ្នាក់巻き込み (ម៉ូតូ/កង់ ពេលបត់)
• ផលវិបាក — ផ្លូវច្បាប់ ហិរញ្ញវត្ថុ និងសីលធម៌`,
    body_en:`Understand common accidents to prevent them:

• Turning accidents (右左折事故)
• Rear-end collisions (追突) — insufficient gap
• "Catch-in" accidents (巻き込み) with bikes when turning
• Consequences — legal, financial, and moral`,
  },
  {
    id:'tt-17', no:'学科17', ja:'自動車の保守管理', stage:2, mins:9,
    km:'ការថែទាំ និងពិនិត្យរថយន្ត', en:'Vehicle Maintenance & Inspection',
    body_km:`ការត្រួតពិនិត្យប្រចាំថ្ងៃ (日常点検) — ស្តង់ដាជប៉ុន:

• ខ្យល់សំបកកង់ (タイヤの空気圧) និងស្នាមសឹក
• កម្រិតប្រេងម៉ាស៊ីន ទឹកត្រជាក់ (エンジンオイル・冷却水)
• ភ្លើង សញ្ញា ហ្វ្រាំង (ライト・ブレーキ)
• ច្បាប់กำหนด車検 (ត្រួតពិនិត្យតាមកាលកំណត់)`,
    body_en:`Daily inspection (日常点検) — Japanese standard:

• Tyre pressure (タイヤの空気圧) and wear
• Engine oil & coolant levels (エンジンオイル・冷却水)
• Lights, signals, brakes (ライト・ブレーキ)
• Mandatory periodic inspection (車検)`,
  },
  {
    id:'tt-18', no:'学科18', ja:'駐車と停車', stage:2, mins:8,
    km:'ការចត និងការឈប់', en:'Parking & Stopping',
    body_km:`ភាពខុសគ្នា: 駐車 (ចត-យូរ) vs 停車 (ឈប់-ខ្លី)។

• កន្លែងហាមចត (駐車禁止) — ផ្លាក, ជិតប្រសព្វ, ឆ្លងថ្មើរជើង
• ហាមចតក្នុង ៥ ម៉ែត្រ ពីប្រសព្វ
• ប្រើ parking brake + បត់កង់ពេលចតលើទីជម្រាល
• បើកភ្លើងព្រមាន (ハザード) ពេលចាំបាច់`,
    body_en:`Difference: 駐車 (parking, long) vs 停車 (stopping, brief).

• No-parking zones (駐車禁止) — signs, near intersections, crossings
• No parking within 5m of an intersection
• Use parking brake + turn wheels when parked on a slope
• Use hazard lights (ハザード) when needed`,
  },
  {
    id:'tt-19', no:'学科19', ja:'乗車と積載・けん引', stage:2, mins:7,
    km:'ការផ្ទុកមនុស្ស ទំនិញ និងការអូស', en:'Passengers, Loading & Towing',
    body_km:`ច្បាប់កំណត់ការផ្ទុក:

• ចំនួនអ្នកដំណើរអតិបរមា (定員)
• ទម្ងន់ និងទំហំទំនិញកំណត់ (積載制限)
• ខ្សែក្រវាត់សុវត្ថិភាពគ្រប់គ្នា (シートベルト)
• កៅអីកុមារ (チャイルドシート) — ក្មេងក្រោម ៦ ឆ្នាំ`,
    body_en:`Rules on carrying load:

• Maximum passenger capacity (定員)
• Cargo weight & size limits (積載制限)
• Seat belts for everyone (シートベルト)
• Child seat (チャイルドシート) — under 6 years old`,
  },
  {
    id:'tt-20', no:'学科20', ja:'運転免許制度・交通反則通告制度', stage:2, mins:8,
    km:'ប្រព័ន្ធប័ណ្ណ និងប្រព័ន្ធពិន័យចរាចរណ៍', en:'License & Traffic Penalty System',
    body_km:`**ប្រព័ន្ធពិន្ទុ (点数制度):**
• បទល្មើស → បូកពិន្ទុ (違反点数)
• ពិន្ទុច្រើន → ផ្អាក ឬដកប័ណ្ណ (免許停止・取消)

**ប្រព័ន្ធពិន័យ (反則金):**
• បទល្មើសស្រាល → ប្រាក់ពិន័យ
• បទធ្ងន់ → តុលាការ`,
    body_en:`**Point system (点数制度):**
• Violations add penalty points (違反点数)
• Too many points → suspension or revocation (免許停止・取消)

**Penalty system (反則金):**
• Minor violations → fine
• Serious violations → court`,
  },
  {
    id:'tt-21', no:'学科21', ja:'交通事故のときの心得と保険制度', stage:2, mins:9,
    km:'ការប្រព្រឹត្តពេលមានគ្រោះថ្នាក់ និងធានារ៉ាប់រង', en:'Accident Response & Insurance',
    body_km:`ពេលមានគ្រោះថ្នាក់ (交通事故) — ៣ ជំហាន:

១. ឈប់រថយន្ត ការពារកន្លែង (二次事故防止)
២. ជួយសង្គ្រោះ ហៅ ១១៩ (救急車)
៣. ជូនដំណឹងប៉ូលិស ១១០ (警察)

**ធានារ៉ាប់រង (保険):**
• 自賠責保険 (កាតព្វកិច្ច) + 任意保険 (ស្ម័គ្រចិត្ត)`,
    body_en:`When an accident happens (交通事故) — 3 steps:

1. Stop, secure the scene (prevent secondary accidents 二次事故防止)
2. Aid the injured, call ambulance 119 (救急車)
3. Report to police 110 (警察)

**Insurance (保険):**
• Compulsory (自賠責保険) + voluntary (任意保険)`,
  },
  {
    id:'tt-22', no:'学科22', ja:'経路の設計', stage:2, mins:7,
    km:'ការរៀបចំផ្លូវធ្វើដំណើរ', en:'Route Planning',
    body_km:`ការគ្រោងផ្លូវ មុនចេញដំណើរ:

• ស្គាល់ផ្លូវ និងគោលដៅជាមុន (下調べ)
• ប្រើផែនទី / Navigation ដោយសុវត្ថិភាព
• គណនាពេលវេលា និងពេលសម្រាក
• ផ្លូវជំនួស ពេលកកស្ទះ`,
    body_en:`Plan your route before departure:

• Study the road and destination in advance (下調べ)
• Use maps / navigation safely
• Allow time and rest stops
• Have alternative routes for congestion`,
  },
  {
    id:'tt-23', no:'学科23', ja:'高速道路での運転', stage:2, mins:11,
    km:'ការបើកបរលើផ្លូវល្បឿនលឿន', en:'Expressway Driving',
    body_km:`ផ្លូវល្បឿនលឿន (高速道路) — ច្បាប់ពិសេស:

• ចូល (合流) ត្រូវ拼速ស្មើចរន្តចរាចរណ៍
• រក្សាគន្លង រក្សាគម្លាតធំ
• ហាមU-turn ហ្វ្រាំងភ្លាម ឬឈប់ (駐停車禁止)
• ពេលខូច → ដាក់ត្រីកោណ (三角表示板) ចេញពីផ្លូវ`,
    body_en:`Expressways (高速道路) — special rules:

• Merge (合流) by matching traffic speed
• Keep your lane, keep a large gap
• No U-turns, sudden braking, or stopping (駐停車禁止)
• If broken down → place warning triangle (三角表示板), exit the road`,
  },
  {
    id:'tt-24', no:'学科24', ja:'危険を予測した運転', stage:2, mins:10,
    km:'ការបើកបរទស្សន៍ទាយគ្រោះថ្នាក់', en:'Hazard-Prediction Driving',
    body_km:`ការទស្សន៍ទាយ (危険予測) — ស្នូលនៃការបើកបរការពារ:

• "かもしれない運転" — សន្មតថាគ្រោះថ្នាក់អាចលាក់នៅគ្រប់ទីកន្លែង
• ក្មេងអាចរត់ចេញ ពីក្រោយឡានចត
• ទ្វារឡានចតអាចបើកភ្លាម
• ពិភាក្សាករណី (ディスカッション) ជាមួយគ្រូ`,
    body_en:`Hazard prediction (危険予測) — the core of defensive driving:

• "It might happen" mindset — assume danger hides everywhere
• A child may dash out from behind a parked car
• A parked car's door may open suddenly
• Case discussions (ディスカッション) with the instructor`,
  },
  {
    id:'tt-25', no:'学科25', ja:'応急救護処置 Ⅰ', stage:2, mins:12,
    km:'ការសង្គ្រោះបឋម (ភាគ១)', en:'First Aid (Part 1)',
    body_km:`ការសង្គ្រោះបឋម (応急救護処置) — ជំនាញចាំបាច់:

• ពិនិត្យសតិ និងផ្លូវដង្ហើម (意識・呼吸の確認)
• ហៅជំនួយ និងរថយន្តសង្គ្រោះ (119)
• ដាក់ឥរិយាបថសុវត្ថិភាព (回復体位)
• បញ្ឈប់ការ​ហូរឈាម`,
    body_en:`First aid (応急救護処置) — essential skills:

• Check consciousness & breathing (意識・呼吸の確認)
• Call for help and ambulance (119)
• Place in recovery position (回復体位)
• Stop bleeding`,
  },
  {
    id:'tt-26', no:'学科26', ja:'応急救護処置 Ⅱ・Ⅲ', stage:2, mins:14,
    km:'ការសង្គ្រោះបឋម (ភាគ២-៣) · CPR', en:'First Aid (Part 2–3) · CPR',
    body_km:`ការ​សង្គ្រោះ​ជីវិត (心肺蘇生) — អនុវត្តន៍:

• ច្របាច់ទ្រូង (胸骨圧迫) — ៣០ ដង, ជម្រៅ ៥ ស.ម
• ផ្លុំខ្យល់ (人工呼吸) — ២ ដង
• ប្រើ AED (自動体外式除細動器)
• បន្តរហូតដល់ជំនួយមកដល់`,
    body_en:`Cardiopulmonary resuscitation (心肺蘇生) — practice:

• Chest compressions (胸骨圧迫) — 30 times, 5cm deep
• Rescue breaths (人工呼吸) — 2 times
• Use an AED (自動体外式除細動器)
• Continue until help arrives`,
  },
];

// ── PRACTICAL 技能教習 ───────────────────────────────────────────────────────
// Stage 1 (所内 · school course): AT 12h / MT 15h  ·  Stage 2 (路上 · public road): 19h
const PRACTICAL_TEXTS = [
  // ───────── 第一段階 技能 (Stage 1 — school course) ─────────
  {
    id:'pt-01', no:'技能1', ja:'車の乗り降りと運転姿勢', stage:1, mins:12,
    km:'ការឡើង-ចុះ និងឥរិយាបថបើកបរ', en:'Getting In/Out & Driving Posture',
    body_km:`មុនបើកបរ — ការរៀបចំត្រឹមត្រូវ (運転姿勢):

• ឡើងឡានដោយសុវត្ថិភាព ពិនិត្យក្រោយ
• លៃកៅអី — ជើងដល់ pedal ងាយស្រួល
• លៃកញ្ចក់ (ミラー調整) — ក្រោយ + ២ ចំហៀង
• ពាក់ខ្សែក្រវាត់ (シートベルト)`,
    body_en:`Before driving — correct setup (運転姿勢):

• Enter safely, check behind you
• Adjust seat — pedals within easy reach
• Adjust mirrors (ミラー調整) — rear + 2 sides
• Fasten seat belt (シートベルト)`,
  },
  {
    id:'pt-02', no:'技能2', ja:'自動車の機構と運転装置の取り扱い', stage:1, mins:16,
    km:'យន្តការ និងឧបករណ៍បញ្ជារថយន្ត', en:'Vehicle Mechanism & Controls',
    body_km:`ស្គាល់ឧបករណ៍បញ្ជា (運転装置):

**ប្រអប់លេខ Auto (AT):**
• P (ចត) · R (ថយក្រោយ) · N (អព្យាក្រឹត) · D (ទៅមុខ)

**Manual (MT):**
• ឃ្លាច់ (クラッチ) + លេខ ១-៥ + ថយក្រោយ
• ការ៉េស (半クラッチ) ពេលចេញដំណើរ

• ចង្កូត ហ្វ្រាំង ល្បឿន សញ្ញា`,
    body_en:`Learn the controls (運転装置):

**Automatic (AT):**
• P (park) · R (reverse) · N (neutral) · D (drive)

**Manual (MT):**
• Clutch (クラッチ) + gears 1–5 + reverse
• Half-clutch (半クラッチ) to pull away

• Steering, brake, accelerator, signals`,
  },
  {
    id:'pt-03', no:'技能3', ja:'発進と停止', stage:1, mins:14,
    km:'ការចេញដំណើរ និងការឈប់', en:'Starting & Stopping',
    body_km:`ការចេញ-ឈប់ ដោយរលូន:

• ពិនិត្យ ៣៦០° មុនចេញ (発進前の安全確認)
• បើកសញ្ញា → មើល死角 → ចេញថ្នមៗ
• ហ្វ្រាំងបន្តិចម្ដងៗ — ឈប់ស្រួល (ブレーキ)
• ឈប់ត្រង់បន្ទាត់ មិនលើស`,
    body_en:`Smooth starting and stopping:

• Check 360° before moving (発進前の安全確認)
• Signal → check blind spot → pull away gently
• Brake gradually — smooth stop (ブレーキ)
• Stop right at the line, not over it`,
  },
  {
    id:'pt-04', no:'技能4', ja:'速度の調節', stage:1, mins:12,
    km:'ការគ្រប់គ្រងល្បឿន', en:'Speed Control',
    body_km:`ការគ្រប់គ្រងល្បឿនរលូន (速度調節):

• បង្កើនល្បឿនថ្នមៗ ដោយ accelerator
• បន្ថយល្បឿនមុនផ្លូវកោង
• គ្រប់គ្រងល្បឿនថេរ
• ល្បឿនសមស្របនឹងស្ថានភាពផ្លូវ`,
    body_en:`Smooth speed control (速度調節):

• Accelerate gently
• Reduce speed before curves
• Maintain a steady speed
• Match speed to road conditions`,
  },
  {
    id:'pt-05', no:'技能5', ja:'走行位置と進路', stage:1, mins:12,
    km:'ទីតាំង និងគន្លងធ្វើដំណើរ', en:'Road Position & Path',
    body_km:`ការរក្សាទីតាំងត្រឹមត្រូវ (走行位置):

• រក្សាក្នុងគន្លង កណ្ដាលផ្លូវ
• រក្សាគម្លាតពីគែមផ្លូវ និងរថយន្តចត
• មើលឆ្ងាយ — មិនមើលតែខាងមុខជិត
• ផ្លូវត្រង់ — ចង្កូតនឹង`,
    body_en:`Maintaining correct position (走行位置):

• Stay centred in your lane
• Keep distance from the kerb and parked cars
• Look far ahead — not just close
• Keep the wheel steady on straights`,
  },
  {
    id:'pt-06', no:'技能6', ja:'カーブや曲がり角の通行', stage:1, mins:14,
    km:'ការបើកបរតាមផ្លូវកោង', en:'Driving Through Curves & Corners',
    body_km:`បច្ចេកទេសផ្លូវកោង (カーブ):

• បន្ថយល្បឿន មុនចូលកោង ("ចូលយឺត ចេញលឿន")
• ប្ដូរចង្កូត រលូន មិនរហ័ស
• ប្រយ័ត្នកម្លាំងផ្ចិតចេញ (遠心力)
• មើលឆ្ពោះទៅផ្លូវចេញ`,
    body_en:`Cornering technique (カーブ):

• Slow before entering ("slow in, fast out")
• Steer smoothly, not abruptly
• Beware centrifugal force (遠心力)
• Look towards the exit of the curve`,
  },
  {
    id:'pt-07', no:'技能7', ja:'坂道の通行', stage:1, mins:14,
    km:'ការបើកបរលើផ្លូវជម្រាល', en:'Driving on Slopes',
    body_km:`ផ្លូវឡើង-ចុះ ទីជម្រាល (坂道):

• ឡើងទួល — ចេញដំណើរ ដោយមិនរអិលក្រោយ (坂道発進)
• MT — ប្រើ parking brake + ការ៉េស
• ចុះទួល — ប្រើ engine brake (エンジンブレーキ)
• ចតលើជម្រាល — បត់កង់`,
    body_en:`Uphill / downhill slopes (坂道):

• Hill start — pull away without rolling back (坂道発進)
• MT — use parking brake + half-clutch
• Downhill — use engine braking (エンジンブレーキ)
• Park on slope — turn the wheels`,
  },
  {
    id:'pt-08', no:'技能8', ja:'後退', stage:1, mins:14,
    km:'ការថយក្រោយ', en:'Reversing',
    body_km:`ការថយក្រោយ ដោយត្រឹមត្រូវ (後退):

• បែរក្បាលមើលក្រោយផ្ទាល់ (目視)
• ល្បឿនយឺត គ្រប់គ្រងបាន
• ប្ដូរចង្កូតបន្តិចម្ដងៗ
• ប្រើកញ្ចក់ + camera ជំនួយ`,
    body_en:`Reversing correctly (後退):

• Turn your head and look directly back (目視)
• Slow, controlled speed
• Steer in small increments
• Use mirrors + camera as aids`,
  },
  {
    id:'pt-09', no:'技能9', ja:'狭路の通行（S字・クランク）', stage:1, mins:18,
    km:'ការបើកបរផ្លូវចង្អៀត (S និង Crank)', en:'Narrow Roads (S-curve & Crank)',
    body_km:`ផ្លូវចង្អៀត — ការសាកល្បងជប៉ុនល្បី (狭路):

**S字 (S-curve):** ផ្លូវកោងរាង S — រក្សាកណ្ដាល
**クランク (Crank):** ផ្លូវកោងកាត់កែង ៩០°
• ល្បឿនយឺត គ្រប់គ្រងចង្កូត
• មើលកង់មុខ និងក្រោយ កុំឱ្យប៉ះគែម (脱輪防止)`,
    body_en:`Narrow roads — famous Japanese test elements (狭路):

**S-curve (S字):** S-shaped path — stay centred
**Crank (クランク):** sharp 90° zig-zag
• Slow speed, careful steering
• Watch front and rear wheels, avoid hitting the kerb (脱輪防止)`,
  },
  {
    id:'pt-10', no:'技能10', ja:'通行位置の選択と進路変更', stage:1, mins:13,
    km:'ការជ្រើសគន្លង និងការប្ដូរគន្លង', en:'Lane Selection & Changing',
    body_km:`ការប្ដូរគន្លង ដោយសុវត្ថិភាព (進路変更):

• បើកសញ្ញា ៣ វិនាទីមុន (合図)
• ពិនិត្យកញ្ចក់ + 死角 (目視)
• ប្ដូរថ្នមៗ ពេលមានទំនេរ
• មិនកាត់មុខ ឬច្របូកច្របល់`,
    body_en:`Changing lanes safely (進路変更):

• Signal 3 seconds before (合図)
• Check mirrors + blind spot (目視)
• Move smoothly when clear
• No cutting in or weaving`,
  },
  {
    id:'pt-11', no:'技能11', ja:'障害物への対応', stage:1, mins:12,
    km:'ការដោះស្រាយឧបសគ្គ', en:'Dealing with Obstacles',
    body_km:`ឧបសគ្គលើផ្លូវ (障害物):

• បន្ថយល្បឿន មុនឆ្លងកាត់
• ផ្ដល់អាទិភាពចរន្តផ្ទុយ បើផ្លូវចង្អៀត
• បើកសញ្ញា និងវាងដោយប្រុងប្រយ័ត្ន
• រក្សាគម្លាតពីឧបសគ្គ`,
    body_en:`Obstacles on the road (障害物):

• Slow down before passing
• Yield to oncoming traffic on narrow roads
• Signal and steer around carefully
• Keep clearance from the obstacle`,
  },
  {
    id:'pt-12', no:'技能12', ja:'信号・標識に従った走行', stage:1, mins:12,
    km:'ការបើកបរតាមភ្លើងសញ្ញា និងផ្លាក', en:'Driving by Signals & Signs',
    body_km:`អនុវត្តន៍ច្បាប់ផ្លូវ ក្នុងសាលា (所内):

• ឈប់ត្រឹមត្រូវ ភ្លើងក្រហម និងផ្លាក STOP (一時停止)
• ឆ្លងកាត់ ពេលបៃតង ដោយប្រុងប្រយ័ត្ន
• គោរពផ្លាកសញ្ញាគ្រប់ប្រភេទ
• ភ្ជាប់ទ្រឹស្ដី (学科) ជាមួយការអនុវត្ត`,
    body_en:`Applying road rules on the course (所内):

• Stop properly at red lights and STOP signs (一時停止)
• Cross on green, carefully
• Obey all signs
• Connect theory (学科) with practice`,
  },
  {
    id:'pt-13', no:'技能13', ja:'交差点の通行（直進・左折・右折）', stage:1, mins:16,
    km:'ការឆ្លងប្រសព្វ (ត្រង់ · ឆ្វេង · ស្ដាំ)', en:'Intersections (Straight · Left · Right)',
    body_km:`ការឆ្លងប្រសព្វ (交差点通行):

**ត្រង់:** ពិនិត្យ ៤ ទិស ល្បឿនសមរម្យ
**ឆ្វេង (左折):** ដិតផ្លូវ ប្រយ័ត្នម៉ូតូ/កង់ (巻き込み確認)
**ស្ដាំ (右折):** ឆ្លងកណ្ដាល ផ្ដល់អាទិភាពចរន្តផ្ទុយ និងថ្មើរជើង`,
    body_en:`Crossing intersections (交差点通行):

**Straight:** check 4 directions, suitable speed
**Left (左折):** hug the left, watch bikes (巻き込み確認)
**Right (右折):** go to centre, yield to oncoming & pedestrians`,
  },
  {
    id:'pt-14', no:'みきわめ', ja:'第一段階みきわめ', stage:1, mins:15,
    km:'ការវាយតម្លៃបញ្ចប់ដំណាក់កាលទី១', en:'Stage 1 Assessment (Mikiwame)',
    body_km:`みきわめ — ការវាយតម្លៃមុនប្រឡង修了検定:

• គ្រូត្រួតពិនិត្យ ជំនាញសាលាទាំងអស់
• ត្រូវ "良好 (ល្អ)" ទើបអាចប្រឡង
• ប្រសិនមិនទាន់ → រៀនបន្ថែម (補習)
• បន្ទាប់ → 修了検定 + 仮免学科試験`,
    body_en:`Mikiwame — assessment before the 修了検定 exam:

• Instructor checks all course skills
• Must reach "良好 (good)" to take the exam
• If not ready → extra lessons (補習)
• Next → 修了検定 + provisional written test`,
  },

  // ───────── 第二段階 技能 (Stage 2 — public road) ─────────
  {
    id:'pt-15', no:'技能14', ja:'路上運転の準備と注意', stage:2, mins:14,
    km:'ការរៀបចំ និងប្រុងប្រយ័ត្ន បើកបរលើផ្លូវសាធារណៈ', en:'Preparing for Public-Road Driving',
    body_km:`ចេញពីសាលា ទៅផ្លូវពិត (路上) ជាមួយ仮免許:

• ផ្លាក "仮免許練習中" ត្រូវបិទ
• មានគ្រូ ឬអ្នកមានប័ណ្ណ ៣ ឆ្នាំ អមដំណើរ
• ប្រុងប្រយ័ត្នខ្ពស់ — ចរាចរណ៍ពិត
• គោរពច្បាប់គ្រប់ពេល`,
    body_en:`From the course to real roads (路上) with a provisional licence:

• Display "仮免許練習中" (learner) plate
• Accompanied by instructor / 3-year licence holder
• Heightened care — real traffic
• Obey all rules at all times`,
  },
  {
    id:'pt-16', no:'技能15', ja:'交通の流れに合わせた走行', stage:2, mins:14,
    km:'ការបើកបរស្របតាមលំហូរចរាចរណ៍', en:'Driving with the Traffic Flow',
    body_km:`ស្របទៅតាមលំហូរ (交通の流れ):

• រក្សាល្បឿនស្របទៅចរន្ត — មិនយឺត ឬលឿនពេក
• រក្សាគម្លាតសមរម្យ
• ព្យាករណ៍សកម្មភាពអ្នកដទៃ
• បើកបររលូន មិនធ្វើឱ្យអ្នកក្រោយភ្ញាក់ផ្អើល`,
    body_en:`Matching the traffic flow (交通の流れ):

• Keep pace with traffic — not too slow or fast
• Maintain a suitable gap
• Anticipate others' actions
• Drive smoothly, don't surprise drivers behind`,
  },
  {
    id:'pt-17', no:'技能16', ja:'適切な通行位置と進路変更', stage:2, mins:13,
    km:'ទីតាំង និងការប្ដូរគន្លងលើផ្លូវ', en:'Road Position & Lane Changes (Public Road)',
    body_km:`ការគ្រប់គ្រងទីតាំងលើផ្លូវពិត:

• ជ្រើសគន្លងត្រឹមត្រូវ មុនបត់
• ប្ដូរគន្លង ដោយសញ្ញា និងពិនិត្យ死角
• ប្រយ័ត្នរថយន្តចត ថ្មើរជើង កង់
• មិនប្ដូរគន្លងញឹកញាប់`,
    body_en:`Managing position on real roads:

• Choose the correct lane before turning
• Change lanes with signal & blind-spot check
• Watch parked cars, pedestrians, cyclists
• Don't change lanes excessively`,
  },
  {
    id:'pt-18', no:'技能17', ja:'歩行者などの保護', stage:2, mins:12,
    km:'ការការពារអ្នកថ្មើរជើងលើផ្លូវ', en:'Protecting Pedestrians (Public Road)',
    body_km:`ការការពារនៅផ្លូវពិត (歩行者保護):

• ឈប់ផ្ដល់ផ្លូវ កន្លែងឆ្លង横断歩道
• បន្ថយល្បឿន តំបន់សាលា លំនៅដ្ឋាន
• ប្រយ័ត្នកុមារ និងចាស់ជរា
• មិនបុំស្នូរ ឬបង្ខំ`,
    body_en:`Protecting people on real roads (歩行者保護):

• Stop and yield at crossings (横断歩道)
• Slow in school and residential zones
• Watch for children and the elderly
• No honking or intimidating`,
  },
  {
    id:'pt-19', no:'技能18', ja:'道路・交通状況に合わせた運転', stage:2, mins:14,
    km:'ការបើកបរស្របតាមស្ថានភាពផ្លូវ', en:'Adapting to Road & Traffic Conditions',
    body_km:`សម្របខ្លួនទៅតាមស្ថានភាព (状況判断):

• ផ្លូវចង្អៀត ផ្លូវកកស្ទះ ផ្លូវការសង់
• ផ្លូវពាណិជ្ជកម្ម — ច្រើនថ្មើរជើង
• ផ្លូវយប់ ឬអាកាសធាតុអាក្រក់
• សម្រេចចិត្តរហ័ស និងសុវត្ថិភាព`,
    body_en:`Adapting to conditions (状況判断):

• Narrow roads, congestion, construction zones
• Commercial streets — many pedestrians
• Night driving or bad weather
• Make quick, safe decisions`,
  },
  {
    id:'pt-20', no:'技能19', ja:'方向変換と縦列駐車', stage:2, mins:18,
    km:'ការបង្វិលទិស និងការចតឆ្នាស (Parallel)', en:'Turning Around & Parallel Parking',
    body_km:`បច្ចេកទេសចត ល្បីក្នុងការប្រឡង (駐車):

**方向変換:** ថយចូលកន្លែង បង្វិលទិស ១៨០°
**縦列駐車 (Parallel):**
១. ឈប់ស្របរថយន្តមុខ
២. ថយ បត់ចង្កូត ចូលមុំ
៣. ត្រង់ បត់ផ្ទុយ — ចូលរលូន`,
    body_en:`Parking techniques, famous in the test (駐車):

**Turning around (方向変換):** reverse into a bay, turn 180°
**Parallel parking (縦列駐車):**
1. Stop parallel to the front car
2. Reverse, turn the wheel, enter at an angle
3. Straighten, counter-steer — ease in`,
  },
  {
    id:'pt-21', no:'技能20', ja:'急ブレーキ', stage:2, mins:10,
    km:'ការហ្វ្រាំងបន្ទាន់', en:'Emergency Braking',
    body_km:`ការហ្វ្រាំងបន្ទាន់ (急ブレーキ):

• ចុចហ្វ្រាំងខ្លាំង និងម៉ឺងម៉ាត់
• ABS — ជើងចុចជាប់ កុំលែង
• គ្រប់គ្រងចង្កូត ឱ្យត្រង់
• យល់ពីចម្ងាយឈប់ ល្បឿនលឿន`,
    body_en:`Emergency braking (急ブレーキ):

• Press the brake hard and firmly
• ABS — keep your foot down, don't release
• Keep steering straight
• Understand stopping distance at speed`,
  },
  {
    id:'pt-22', no:'技能21', ja:'自主経路設定', stage:2, mins:14,
    km:'ការកំណត់ផ្លូវ ដោយខ្លួនឯង', en:'Independent Route Driving',
    body_km:`បើកបរ ដោយខ្លួនឯង (自主経路):

• គ្រូឱ្យគោលដៅ — សិស្សរកផ្លូវផ្ទាល់
• គ្រោងផ្លូវ ក្នុងចិត្តជាមុន
• បើកបរ ដោយមិនពឹងគ្រូ
• បង្កើនទំនុកចិត្ត`,
    body_en:`Driving on your own (自主経路):

• Instructor gives a destination — you find the way
• Plan the route mentally in advance
• Drive without relying on the instructor
• Build confidence`,
  },
  {
    id:'pt-23', no:'技能22', ja:'高速教習', stage:2, mins:20,
    km:'ការបង្រៀនលើផ្លូវល្បឿនលឿន', en:'Expressway Lesson',
    body_km:`បទពិសោធផ្លូវល្បឿនលឿន (高速教習):

• ការចូល (合流) ល្បឿនខ្ពស់
• រក្សាគន្លង គម្លាតធំ
• ប្ដូរគន្លងល្បឿនលឿន ដោយសុវត្ថិភាព
• ការចេញ (出口) និងតម្លៃ ETC
• អាចធ្វើ ដោយ simulator បើអាកាសធាតុអាក្រក់`,
    body_en:`Expressway experience (高速教習):

• Merging (合流) at high speed
• Hold your lane, large gaps
• Safe high-speed lane changes
• Exits (出口) and ETC tolls
• May use a simulator in bad weather`,
  },
  {
    id:'pt-24', no:'技能23', ja:'危険を予測した運転', stage:2, mins:14,
    km:'ការបើកបរ ទស្សន៍ទាយគ្រោះថ្នាក់ (អនុវត្ត)', en:'Hazard-Prediction Driving (Practice)',
    body_km:`អនុវត្តន៍ការទស្សន៍ទាយ (危険予測運転):

• មើលឆ្ងាយ ស្វែងរកគ្រោះថ្នាក់លាក់
• "かもしれない" — ក្មេង/កង់ អាចចេញ
• រក្សា空間 (space) ជុំវិញរថយន្ត
• ត្រៀមហ្វ្រាំង ពេលប្រឈម`,
    body_en:`Practising hazard prediction (危険予測運転):

• Look far ahead, scan for hidden dangers
• "It might happen" — a child/bike may emerge
• Keep space around the vehicle
• Cover the brake when at risk`,
  },
  {
    id:'pt-25', no:'みきわめ', ja:'第二段階みきわめ', stage:2, mins:15,
    km:'ការវាយតម្លៃបញ្ចប់ដំណាក់កាលទី២', en:'Stage 2 Assessment (Mikiwame)',
    body_km:`みきわめ — ការវាយតម្លៃ មុនប្រឡង卒業検定:

• គ្រូត្រួតពិនិត្យ ជំនាញផ្លូវពិតទាំងអស់
• ត្រូវ "良好" ទើបអាចប្រឡងបញ្ចប់
• ប្រសិនមិនទាន់ → 補習
• បន្ទាប់ → 卒業検定 → 本免学科試験`,
    body_en:`Mikiwame — assessment before the 卒業検定 exam:

• Instructor checks all public-road skills
• Must reach "良好 (good)" to take the graduation exam
• If not ready → extra lessons (補習)
• Next → 卒業検定 → final written test (本免)`,
  },
];

// ── EXAM MILESTONES 検定・試験 ─────────────────────────────────────────────────
const EXAM_MILESTONES = [
  {
    id:'ex-01', no:'①', ja:'適性検査', stage:0, pass:'—',
    km:'ការត្រួតពិនិត្យសមត្ថភាព', en:'Aptitude Test',
    desc_km:'ពិនិត្យ ការមើល (視力 0.7+), ការបែងចែកពណ៌, ការស្ដាប់ និងប្រតិកម្ម — មុនចាប់ផ្ដើមរៀន។',
    desc_en:'Checks vision (視力 0.7+), colour recognition, hearing & reaction — taken before lessons begin.',
  },
  {
    id:'ex-02', no:'②', ja:'修了検定（修検）', stage:1, pass:'70/100',
    km:'ការប្រឡងបញ្ចប់ដំណាក់កាល ១ (ការអនុវត្ត)', en:'Stage 1 Driving Exam (Shūryō-kentei)',
    desc_km:'ការប្រឡងបើកបរ ក្នុងសាលា (所内) — S字, クランク, 坂道発進, ការចត។ ត្រូវបាន ៧០ ពិន្ទុ ឡើងទៅ។',
    desc_en:'In-course driving test (所内) — S-curve, crank, hill start, parking. Need 70 points or more.',
  },
  {
    id:'ex-03', no:'③', ja:'仮免学科試験', stage:1, pass:'45/50',
    km:'ការប្រឡងទ្រឹស្ដី ប័ណ្ណបណ្ដោះអាសន្ន', en:'Provisional Licence Written Test',
    desc_km:'ប្រឡងសរសេរ ៥០ សំណួរ (○✕) លើ学科 1–10។ ត្រូវបាន ៤៥/៥០ (90%)។ ជោគជ័យ → ទទួល仮免許។',
    desc_en:'Written test, 50 ○✕ questions on units 1–10. Need 45/50 (90%). Pass → provisional licence (仮免許).',
  },
  {
    id:'ex-04', no:'④', ja:'卒業検定（卒検）', stage:2, pass:'70/100',
    km:'ការប្រឡងបញ្ចប់ (ការអនុវត្តលើផ្លូវ)', en:'Graduation Driving Exam (Sotsugyō-kentei)',
    desc_km:'ការប្រឡងបើកបរ លើផ្លូវសាធារណៈ (路上) + ការចត។ ត្រូវបាន ៧០ ពិន្ទុ។ ជោគជ័យ → 卒業証明書។',
    desc_en:'Driving test on public roads (路上) + parking. Need 70 points. Pass → graduation certificate (卒業証明書).',
  },
  {
    id:'ex-05', no:'⑤', ja:'本免学科試験', stage:2, pass:'90/100',
    km:'ការប្រឡងទ្រឹស្ដី ប័ណ្ណពេញ (មជ្ឈមណ្ឌល)', en:'Final Written Test (Licence Centre)',
    desc_km:'ប្រឡងសរសេរ ៩៥ សំណួរ នៅមជ្ឈមណ្ឌលប័ណ្ណ (免許センター)។ ត្រូវបាន ៩០/១០០។ ជោគជ័យ → ប័ណ្ណបើកបរ 🎉។',
    desc_en:'Written test of 95 questions at the licence centre (免許センター). Need 90/100. Pass → full driving licence 🎉.',
  },
];

// ── VIDEOS (relabelled to Japanese curriculum) ───────────────────────────────
const THEORY_VIDEOS = [
  { id:'tv-01', km:'ផ្លាកសញ្ញាផ្លូវ (標識) — ការពន្យល់', en:'Road Signs (標識) Explained', ytId:'oS_MbVJuLb0', duration:480 },
  { id:'tv-02', km:'ច្បាប់ចរាចរណ៍ជប៉ុន (Overview)', en:'Japanese Traffic Law Overview', ytId:'8qnlYsm3kHk', duration:620 },
];
const PRACTICAL_VIDEOS = [
  { id:'pv-01', km:'クランク・S字 — បច្ចេកទេស', en:'Crank & S-curve Technique', ytId:'l_7qITNDg4Q', duration:540 },
  { id:'pv-02', km:'縦列駐車 (Parallel Parking)', en:'Parallel Parking (縦列駐車)', ytId:'TqLpPVOdmfQ', duration:720 },
];

// ── EXERCISES (仮免 / 本免 mock style ○✕) ──────────────────────────────────────
const THEORY_EXERCISES = [
  {
    id:'te-01', km:'លំហាត់ · 仮免学科 (សំណួរ ○✕)', en:'Quiz · Provisional Mock (○✕)',
    questions:[
      { q_km:'ភ្លើងលឿង មានន័យថា "ប្រញាប់ឆ្លងមុនក្រហម"។', q_en:'A yellow light means "rush through before red".',
        opts_km:['✕ ខុស — ត្រូវឈប់','◯ ត្រូវ'], opts_en:['✕ False — you must stop','◯ True'], answer:0 },
      { q_km:'នៅ踏切 (ផ្លូវរថភ្លើង) ត្រូវឈប់ពេញលេញជានិច្ច។', q_en:'You must always make a full stop at a railroad crossing (踏切).',
        opts_km:['◯ ត្រូវ','✕ ខុស'], opts_en:['◯ True','✕ False'], answer:0 },
      { q_km:'ល្បឿនកំណត់តាមច្បាប់ (法定速度) ផ្លូវធម្មតា គឺ ៦០ គ.ម/ម៉ោង។', q_en:'The legal default speed (法定速度) on ordinary roads is 60 km/h.',
        opts_km:['◯ ត្រូវ','✕ ខុស'], opts_en:['◯ True','✕ False'], answer:0 },
    ],
  },
  {
    id:'te-02', km:'លំហាត់ · 本免学科 (សំណួរ ○✕)', en:'Quiz · Final Mock (○✕)',
    questions:[
      { q_km:'ចម្ងាយហ្វ្រាំង (制動距離) កើនឡើងតាមការ៉េនៃល្បឿន។', q_en:'Braking distance (制動距離) increases with the square of speed.',
        opts_km:['◯ ត្រូវ','✕ ខុស'], opts_en:['◯ True','✕ False'], answer:0 },
      { q_km:'"かもしれない運転" មានន័យថា សន្មតថា អ្វីៗនឹងមិនអីទេ។', q_en:'"Kamoshirenai driving" means assuming everything will be fine.',
        opts_km:['✕ ខុស — សន្មតថា គ្រោះថ្នាក់អាចកើត','◯ ត្រូវ'], opts_en:['✕ False — assume danger may happen','◯ True'], answer:0 },
      { q_km:'ពេលធ្វើ CPR ច្របាច់ទ្រូង ៣០ ដង បន្ទាប់មកផ្លុំខ្យល់ ២ ដង។', q_en:'In CPR, do 30 chest compressions then 2 rescue breaths.',
        opts_km:['◯ ត្រូវ','✕ ខុស'], opts_en:['◯ True','✕ False'], answer:0 },
    ],
  },
];
const PRACTICAL_EXERCISES = [
  {
    id:'pe-01', km:'លំហាត់ · ដំណាក់កាល ១ (所内)', en:'Quiz · Stage 1 (Course)',
    questions:[
      { q_km:'ក្នុង クランク (Crank) គួរបើកបរ ល្បឿនយ៉ាងណា?', q_en:'In the crank course (クランク) you should drive:',
        opts_km:['យឺត គ្រប់គ្រងបាន','លឿន'], opts_en:['Slow and controlled','Fast'], answer:0 },
      { q_km:'ការចេញដំណើរលើទួល (坂道発進) ត្រូវប្រុងប្រយ័ត្នអ្វី?', q_en:'A hill start (坂道発進) requires care to avoid:',
        opts_km:['រអិលថយក្រោយ','ល្បឿនលឿនពេក'], opts_en:['Rolling backwards','Going too fast'], answer:0 },
      { q_km:'មុនប្ដូរគន្លង ត្រូវ?', q_en:'Before changing lanes you must:',
        opts_km:['បើកសញ្ញា + ពិនិត្យ死角','បត់ភ្លាម'], opts_en:['Signal + check blind spot','Turn immediately'], answer:0 },
    ],
  },
  {
    id:'pe-02', km:'លំហាត់ · ដំណាក់កាល ២ (路上)', en:'Quiz · Stage 2 (Public Road)',
    questions:[
      { q_km:'縦列駐車 (Parallel) ត្រូវប្រើ gear អ្វី ដើម្បីថយ?', q_en:'Which gear reverses for parallel parking (縦列駐車)?',
        opts_km:['R','D'], opts_en:['R','D'], answer:0 },
      { q_km:'ការហ្វ្រាំងបន្ទាន់ ជាមួយ ABS — ត្រូវ?', q_en:'Emergency braking with ABS — you should:',
        opts_km:['ចុចជាប់ កុំលែង','ចុច-លែង បន្តៗ'], opts_en:['Press firmly, do not release','Pump on/off'], answer:0 },
    ],
  },
];

// ── YouTube API loader — singleton ────────────────────────────────────────────
const ensureYTApi = (callback) => {
  if (window.YT && window.YT.Player) { callback(); return; }
  window.__ytQueue = window.__ytQueue || [];
  window.__ytQueue.push(callback);
  if (!document.getElementById('yt-api-script')) {
    window.onYouTubeIframeAPIReady = () => {
      (window.__ytQueue || []).forEach(fn => fn());
      window.__ytQueue = [];
    };
    const s = document.createElement('script');
    s.id = 'yt-api-script';
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
};

const fmtTime = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const fmtDur  = (s, tr) => `${Math.floor(s/60)} ${tr('នាទី','min')}`;

// ── VideoCard ─────────────────────────────────────────────────────────────────
const VideoCard = ({ video, state = {}, onUpdate }) => {
  const [open, setOpen] = React.useState(false);
  const { tr }       = useAppActions();

  const STATUS_MAP = {
    done:     { km:'បានមើលចប់',      en:'Watched',        tone:'good'    },
    watching: { km:'កំពុងមើល',       en:'Watching',       tone:'accent'  },
    sleeping: { km:'មិនទាន់បានមើល', en:'Not yet watched', tone:'warn'    },
  };
  const st = STATUS_MAP[state.status];

  // Extract the bare 11-char video ID from anything that was saved (a full URL,
  // a youtu.be link, a Shorts link, or the ID itself). A full URL left in the
  // src is the usual cause of "Error 153 · configuration error".
  const ytId = (() => {
    const v = String(video.ytId || '').trim();
    const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : v;
  })();
  // Plain embed — use youtube.com (more videos allowed than youtube-nocookie) and
  // a plain iframe, which works even when the file is opened directly (file://).
  const embedSrc = `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`;

  // Mark "watching" the first time the player is opened
  React.useEffect(() => {
    if (open && state.status !== 'done' && state.status !== 'watching') {
      onUpdate(video.id, { status: 'watching', evidence: null });
    }
  }, [open]);

  return (
    <div style={{
      border: `1px solid ${state.status === 'done' ? 'var(--good)' : 'var(--border)'}`,
      borderRadius: 12, overflow: 'hidden', background: 'var(--surface)',
      transition: 'border-color .15s',
    }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: open ? 'var(--surface-muted)' : 'var(--surface)',
        border: 'none', cursor: 'pointer', padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        textAlign: 'left', font: 'inherit', color: 'inherit',
      }}>
        {/* Thumbnail */}
        <div style={{
          width: 88, height: 56, borderRadius: 8, overflow: 'hidden',
          flexShrink: 0, background: 'var(--surface-muted)', position: 'relative',
        }}>
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
            alt=""
          />
          {/* Play overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.25)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {open
                ? <Icon name="chev" size={12} stroke={2.5} style={{transform:'rotate(90deg)'}}/>
                : <svg width="9" height="11" viewBox="0 0 9 11" fill="var(--ink)"><path d="M0 0l9 5.5L0 11V0z"/></svg>
              }
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{tr(video.km, video.en)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{fmtDur(video.duration, tr)}</div>
        </div>

        {st && <Badge tone={st.tone}>{tr(st.km, st.en)}</Badge>}
      </button>

      {/* Player */}
      {open && (
        <div>
          <div style={{ paddingBottom: '56.25%', position: 'relative', background: '#000' }}>
            <iframe
              src={embedSrc}
              title={tr(video.km, video.en)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          {/* Controls */}
          <div style={{
            padding: '10px 14px', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            {state.status === 'done' ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--good)', fontWeight:500 }}>
                <Icon name="check" size={14} stroke={2.5}/>{tr('បានមើលចប់ · ល្អណាស់!','Watched · Well done!')}
              </div>
            ) : (
              <button onClick={() => onUpdate(video.id, { status:'done', evidence:null })} style={{
                fontSize:12, padding:'6px 14px', borderRadius:7, fontWeight:600, cursor:'pointer',
                border:'1px solid var(--good)', background:'var(--good)', color:'#fff',
                display:'inline-flex', alignItems:'center', gap:6,
              }}>✓ {tr('សម្គាល់ថាបានមើលចប់','Mark as watched')}</button>
            )}
            <a href={`https://www.youtube.com/watch?v=${ytId}`} target="_blank" rel="noreferrer" style={{
              fontSize:11, padding:'6px 12px', borderRadius:7, cursor:'pointer', textDecoration:'none',
              border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-2)',
              display:'inline-flex', alignItems:'center', gap:5, marginLeft:'auto',
            }}>↗ {tr('បើកក្នុង YouTube','Open in YouTube')}</a>
          </div>
        </div>
      )}
    </div>
  );
};

// ── TextCard (with Japanese unit name + stage badge) ─────────────────────────
const TextCard = ({ lesson, done, onToggle }) => {
  const [open, setOpen] = React.useState(false);
  const { tr, lang } = useAppActions();

  const renderBody = (text) => text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 8 }}/>;
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} style={{ fontWeight: 700, marginTop: 12, marginBottom: 4, fontSize: 13 }}>{line.slice(2, -2)}</div>;
    }
    if (line.startsWith('• ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, color: 'var(--ink-2)', marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0 }}>·</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    }
    return <div key={i} style={{ color: 'var(--ink-2)', marginBottom: 3 }}>{line}</div>;
  });

  return (
    <div style={{
      border: `1px solid ${done ? 'var(--good)' : 'var(--border)'}`,
      borderRadius: 12, overflow: 'hidden', background: 'var(--surface)',
      transition: 'border-color .15s',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
        textAlign: 'left', font: 'inherit', color: 'inherit',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: done ? 'var(--good)' : 'var(--surface-muted)',
          color: done ? '#fff' : 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done ? <Icon name="check" size={16} stroke={2.5}/> : <Icon name="book" size={16}/>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{tr(lesson.km, lesson.en)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {lesson.no && <span style={{ fontFamily:'"JetBrains Mono",monospace', color:'var(--accent)', fontWeight:600 }}>{lesson.no}</span>}
            {lesson.ja && <span style={{ color:'var(--ink-2)' }}>{lesson.ja}</span>}
            <span>· {lesson.mins} {tr('នាទី', 'min')}</span>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? 'rotate(90deg)' : '', transition: 'transform .15s', flexShrink: 0 }}>
          <path d="M9 6l6 6-6 6"/>
        </svg>
      </button>

      {open && (
        <div style={{ padding: '4px 14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.75 }}>
            {renderBody(tr(lesson.body_km, lesson.body_en))}
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn kind={done ? 'ghost' : 'primary'} onClick={() => onToggle(lesson.id)}>
              {done ? tr('សម្គាល់ថាមិនទាន់អាន', 'Mark as unread') : tr('សម្គាល់ថាបានអាន ✓', 'Mark as read ✓')}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ExerciseCard ──────────────────────────────────────────────────────────────
const ExerciseCard = ({ exercise, done, onDone }) => {
  const [open, setOpen] = React.useState(false);
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const { tr } = useAppActions();

  const total  = exercise.questions.length;
  const score  = submitted ? exercise.questions.filter((q, i) => answers[i] === q.answer).length : null;
  const passed = score === total;

  const handleSubmit = () => {
    setSubmitted(true);
    if (score === total) onDone(exercise.id);
  };

  const handleReset = () => { setAnswers({}); setSubmitted(false); };

  return (
    <div style={{
      border: `1px solid ${done ? 'var(--good)' : 'var(--border)'}`,
      borderRadius: 12, overflow: 'hidden', background: 'var(--surface)',
      transition: 'border-color .15s',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
        textAlign: 'left', font: 'inherit', color: 'inherit',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: done ? 'var(--good)' : 'var(--accent-soft)',
          color: done ? '#fff' : 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17,
        }}>
          {done ? <Icon name="check" size={16} stroke={2.5}/> : '✏️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{tr(exercise.km, exercise.en)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
            {total} {tr('សំណួរ', 'questions')}
          </div>
        </div>
        {done && <Badge tone="good">{tr('ឆ្លងកាត់', 'Passed')}</Badge>}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? 'rotate(90deg)' : '', transition: 'transform .15s', flexShrink: 0 }}>
          <path d="M9 6l6 6-6 6"/>
        </svg>
      </button>

      {open && (
        <div style={{ padding: '4px 14px 16px', borderTop: '1px solid var(--border)' }}>
          {exercise.questions.map((q, qi) => {
            const opts = tr(q.opts_km, q.opts_en);
            return (
              <div key={qi} style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
                  {qi + 1}. {tr(q.q_km, q.q_en)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {opts.map((opt, oi) => {
                    const selected  = answers[qi] === oi;
                    const isCorrect = oi === q.answer;
                    let bg = 'var(--surface-muted)', bd = 'var(--border)';
                    if (submitted) {
                      if (isCorrect)           { bg = 'rgba(59,122,87,.1)';  bd = 'var(--good)'; }
                      else if (selected)       { bg = 'rgba(176,65,62,.08)'; bd = 'var(--danger)'; }
                    } else if (selected) {
                      bg = 'var(--accent-soft)'; bd = 'var(--accent)';
                    }
                    return (
                      <button key={oi} disabled={submitted} onClick={() => setAnswers(a => ({...a, [qi]: oi}))} style={{
                        padding: '9px 14px', border: `1.5px solid ${bd}`,
                        borderRadius: 8, background: bg, textAlign: 'left',
                        fontSize: 13, cursor: submitted ? 'default' : 'pointer',
                        font: 'inherit', color: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'background .1s, border-color .1s',
                      }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${selected && !submitted ? 'var(--accent)' : isCorrect && submitted ? 'var(--good)' : selected && submitted ? 'var(--danger)' : 'var(--border-strong)'}`,
                          background: selected ? (submitted ? (isCorrect ? 'var(--good)' : 'var(--danger)') : 'var(--accent)') : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700,
                        }}>
                          {submitted && isCorrect ? '✓' : submitted && selected && !isCorrect ? '✗' : selected ? '●' : ''}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 14 }}>
            {submitted ? (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: passed ? 'rgba(59,122,87,.08)' : 'rgba(176,65,62,.07)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{passed ? '🎉' : '😅'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: passed ? 'var(--good)' : 'var(--danger)' }}>
                    {passed ? tr('ឆ្លងកាត់! ល្អណាស់!', 'Passed! Well done!') : tr('ព្យាយាមមើលម្ដងទៀត', 'Try again')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                    {score}/{total} {tr('ចម្លើយត្រូវ', 'correct answers')}
                  </div>
                </div>
                {!passed && (
                  <button onClick={handleReset} style={{
                    fontSize: 12, padding: '5px 12px', border: '1px solid var(--border)',
                    borderRadius: 8, background: 'var(--surface)', cursor: 'pointer',
                    color: 'var(--ink-2)',
                  }}>
                    {tr('ព្យាយាមមើលម្ដងទៀត', 'Try again')}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn
                  kind="primary"
                  onClick={handleSubmit}
                  style={Object.keys(answers).length < total ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {tr('ផ្ញើចម្លើយ', 'Submit answers')}
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── ExamMilestone card ────────────────────────────────────────────────────────
const ExamCard = ({ exam }) => {
  const { tr } = useAppActions();
  const stageColor = exam.stage===1 ? '#2A5DB0' : exam.stage===2 ? '#3B7A57' : '#8E5223';
  const stageBg    = exam.stage===1 ? '#E5EBF5' : exam.stage===2 ? '#E2EFE7' : '#F6E9DC';
  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:12, background:'var(--surface)', padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
      <div style={{ width:40, height:40, borderRadius:10, background:stageBg, color:stageColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, flexShrink:0 }}>{exam.no}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600 }}>{tr(exam.km, exam.en)}</div>
        <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:1, fontWeight:500 }}>{exam.ja}</div>
        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:6, lineHeight:1.6 }}>{tr(exam.desc_km, exam.desc_en)}</div>
      </div>
      {exam.pass!=='—' && (
        <div style={{ flexShrink:0, textAlign:'right' }}>
          <div style={{ fontSize:10, color:'var(--ink-3)', fontFamily:'"JetBrains Mono",monospace' }}>{tr('ត្រូវបាន','PASS')}</div>
          <div style={{ fontSize:14, fontWeight:700, color:stageColor }}>{exam.pass}</div>
        </div>
      )}
    </div>
  );
};

// ── Section header helper ─────────────────────────────────────────────────────
const LessonSectionLabel = ({ km, en, icon }) => {
  const { tr } = useAppActions();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 10, paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
    }}>
      <Icon name={icon} size={14}/>
      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '.08em',
        textTransform: 'uppercase', color: 'var(--ink-2)',
        fontFamily: '"JetBrains Mono", monospace',
      }}>
        {tr(km, en)}
      </span>
    </div>
  );
};

// ── Stage banner ──────────────────────────────────────────────────────────────
const StageBanner = ({ stage, hours }) => {
  const { tr } = useAppActions();
  const isOne = stage === 1;
  const color = isOne ? '#2A5DB0' : '#3B7A57';
  const bg    = isOne ? '#E5EBF5' : '#E2EFE7';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:bg, borderRadius:12, marginBottom:14 }}>
      <div style={{ width:44, height:44, borderRadius:11, background:color, color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, lineHeight:1 }}>
        <span style={{ fontSize:9, opacity:.85 }}>STAGE</span>
        <span style={{ fontSize:20, fontWeight:800 }}>{stage}</span>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color }}>
          {isOne ? tr('ដំណាក់កាលទី ១ · 第一段階','Stage 1 · 第一段階') : tr('ដំណាក់កាលទី ២ · 第二段階','Stage 2 · 第二段階')}
        </div>
        <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:1 }}>
          {isOne ? tr('ការបើកបរក្នុងសាលា (所内)','Driving on the school course (所内)') : tr('ការបើកបរលើផ្លូវសាធារណៈ (路上)','Driving on public roads (路上)')}
        </div>
      </div>
      {hours && <Badge tone={isOne?'accent':'good'}>{hours}</Badge>}
    </div>
  );
};

// ── LessonsScreen ─────────────────────────────────────────────────────────────
const LessonsScreen = ({ role }) => {
  const { tr } = useAppActions();
  const [section, setSection]     = React.useState('theory');
  const [readTexts, setReadTexts] = React.useState(new Set());
  const [doneExs, setDoneExs]     = React.useState(new Set());
  const [vidStates, setVidStates] = React.useState({});

  if (role !== 'student') {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{tr('មុខងារ​នេះ​សម្រាប់​សិស្ស​ប៉ុណ្ណោះ', 'This section is for enrolled students only')}</div>
      </div>
    );
  }

  const isTests   = section === 'tests';
  const texts     = section === 'theory' ? THEORY_TEXTS    : section === 'practical' ? PRACTICAL_TEXTS : [];
  const videos    = section === 'theory' ? THEORY_VIDEOS   : section === 'practical' ? PRACTICAL_VIDEOS : [];
  const exercises = section === 'theory' ? THEORY_EXERCISES: section === 'practical' ? PRACTICAL_EXERCISES : [];

  const stage1Texts = texts.filter(t => t.stage === 1);
  const stage2Texts = texts.filter(t => t.stage === 2);

  const updateVid = React.useCallback((id, update) => {
    setVidStates(prev => {
      const existing = prev[id] || {};
      const patch    = typeof update === 'function' ? update(existing) : update;
      if (!patch) return prev;
      return { ...prev, [id]: { ...existing, ...patch } };
    });
  }, []);

  const readCount   = texts.filter(t => readTexts.has(t.id)).length;
  const doneVids    = videos.filter(v => vidStates[v.id]?.status === 'done').length;
  const doneExCount = exercises.filter(e => doneExs.has(e.id)).length;

  const SECTIONS = [
    { id: 'theory',    km: 'ទ្រឹស្ដី · 学科',  en: 'Theory · 学科',    icon: 'book'  },
    { id: 'practical', km: 'អនុវត្ត · 技能',  en: 'Practical · 技能', icon: 'car'   },
    { id: 'tests',     km: 'ការប្រឡង · 検定', en: 'Exams · 検定',     icon: 'check' },
  ];

  const toggleRead = id => setReadTexts(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div style={{ maxWidth: 760 }}>
      <SectionTitle km="មេរៀន · ស្តង់ដាជប៉ុន (自動車教習所)" en="Lessons · Japanese Standard (自動車教習所)"/>

      {/* Section pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap:'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '8px 18px', borderRadius: 999, cursor: 'pointer',
            border: `1.5px solid ${section === s.id ? 'var(--ink)' : 'var(--border)'}`,
            background: section === s.id ? 'var(--ink)' : 'var(--surface)',
            color: section === s.id ? 'var(--bg)' : 'var(--ink-2)',
            fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all .15s',
          }}>
            <Icon name={s.icon} size={14}/>
            {tr(s.km, s.en)}
          </button>
        ))}
      </div>

      {/* ── TESTS section ── */}
      {isTests ? (
        <div>
          <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.7, marginBottom:18, padding:'12px 16px', background:'var(--surface-muted)', borderRadius:12 }}>
            {tr(
              'ដំណើរការ ៥ ជំហាន ដើម្បីទទួលបានប័ណ្ណបើកបរ តាមស្តង់ដាជប៉ុន — ពីការត្រួតពិនិត្យសមត្ថភាព រហូតដល់ការប្រឡងចុងក្រោយ នៅមជ្ឈមណ្ឌលប័ណ្ណ។',
              'The 5-step Japanese path to a driving licence — from the aptitude test through to the final exam at the licence centre.'
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {EXAM_MILESTONES.map(ex => <ExamCard key={ex.id} exam={ex}/>)}
          </div>
        </div>
      ) : (
        <>
          {/* Progress summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
            {[
              { km: 'អត្ថបទ', en: 'Texts read',  val: readCount,   total: texts.length,     icon: 'book'  },
              { km: 'វីដេអូ', en: 'Videos done', val: doneVids,    total: videos.length,    icon: 'check' },
              { km: 'លំហាត់', en: 'Exercises',   val: doneExCount, total: exercises.length, icon: 'star'  },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '14px 16px', border: '1px solid var(--border)',
                borderRadius: 12, background: 'var(--surface)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'var(--surface-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={item.icon} size={15}/>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>
                    {item.val}
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)' }}>/{item.total}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{tr(item.km, item.en)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Video Lessons */}
          <LessonSectionLabel km="មេរៀនវីដេអូ" en="Video Lessons" icon="users"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {videos.map(v => (
              <VideoCard key={v.id} video={v} state={vidStates[v.id] || {}} onUpdate={updateVid}/>
            ))}
          </div>

          {/* Text Lessons — grouped by stage */}
          <LessonSectionLabel
            km={section==='theory' ? 'មេរៀនទ្រឹស្ដី (学科教習)' : 'មេរៀនអនុវត្ត (技能教習)'}
            en={section==='theory' ? 'Theory Lessons (学科教習)' : 'Practical Lessons (技能教習)'}
            icon={section==='theory' ? 'book' : 'car'}/>

          <StageBanner stage={1} hours={section==='theory' ? tr('学科 1–10','学科 1–10') : tr('AT 12h / MT 15h','AT 12h / MT 15h')}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {stage1Texts.map(t => (
              <TextCard key={t.id} lesson={t} done={readTexts.has(t.id)} onToggle={toggleRead}/>
            ))}
          </div>

          <StageBanner stage={2} hours={section==='theory' ? tr('学科 11–26','学科 11–26') : tr('路上 19h','路上 19h')}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {stage2Texts.map(t => (
              <TextCard key={t.id} lesson={t} done={readTexts.has(t.id)} onToggle={toggleRead}/>
            ))}
          </div>

          {/* Exercises */}
          <LessonSectionLabel km="លំហាត់ប្រឡងសាកល្បង" en="Mock-exam Exercises" icon="star"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {exercises.map(ex => (
              <ExerciseCard
                key={ex.id} exercise={ex}
                done={doneExs.has(ex.id)}
                onDone={id => setDoneExs(prev => new Set([...prev, id]))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

Object.assign(window, { LessonsScreen });

// Expose live mutable arrays so screens-admin-lessons.jsx can mutate them in place
if (!window.__lessonsLib) {
  window.__lessonsLib = {
    theoryTexts:        THEORY_TEXTS,
    theoryVideos:       THEORY_VIDEOS,
    theoryExercises:    THEORY_EXERCISES,
    practicalTexts:     PRACTICAL_TEXTS,
    practicalVideos:    PRACTICAL_VIDEOS,
    practicalExercises: PRACTICAL_EXERCISES,
    examMilestones:     EXAM_MILESTONES,
  };
}
