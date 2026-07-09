// screens-lessons.jsx — Student Lessons (Japanese 自動車教習所 standard curriculum)
// Structure: 第一段階 (Stage 1 · school course) → 第二段階 (Stage 2 · public road)
// Theory 学科 1–26 · Practical 技能 (AT 12h / MT 15h stage1, 19h stage2) · Exam milestones

// ── Lesson body: HTML (rich text) helpers ─────────────────────────────────
// Lesson bodies can be either the legacy markdown-ish text (**heading**, • bullet,
// ![](img:ID)) OR rich HTML produced by the WYSIWYG editor. These helpers detect
// and safely render the HTML variant; defined here (loads before the admin
// lesson editor) so both screens share one implementation.
const LESSON_HTML_RE = /<(p|div|br|ul|ol|li|span|b|i|u|s|strike|strong|em|mark|a|blockquote|pre|hr|font|h[1-6]|img)\b[^>]*>/i;
const isLessonHtml = (s) => LESSON_HTML_RE.test(s || '');
const escapeLessonHtml = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Convert a legacy markdown body to HTML so it shows formatted in the WYSIWYG
// editor (and migrates to HTML on the next save).
const lessonMdToHtml = (md, images) => {
  const lines = (md || '').split('\n');
  const out = []; let inList = false;
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  lines.forEach(raw => {
    const line = raw.replace(/\r$/, '');
    const t = line.trim();
    const imgM = t.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
    if (imgM) {
      closeList();
      let src = imgM[1];
      if (src.startsWith('img:')) src = (images || {})[src.slice(4)] || '';
      if (src) out.push('<img src="' + src + '">');
      return;
    }
    if (!t) { closeList(); out.push('<div><br></div>'); return; }
    if (t.startsWith('**') && t.endsWith('**')) { closeList(); out.push('<div><b>' + escapeLessonHtml(t.slice(2, -2)) + '</b></div>'); return; }
    if (t.startsWith('• ') || t.startsWith('- ')) { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + escapeLessonHtml(t.slice(2)) + '</li>'); return; }
    closeList();
    out.push('<div>' + escapeLessonHtml(line).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>') + '</div>');
  });
  closeList();
  return out.join('');
};

// Strip dangerous markup and resolve any img:ID tokens before rendering.
const sanitizeLessonHtml = (html, images) => {
  let s = String(html || '');
  s = s.replace(/src\s*=\s*"img:([^"]+)"/g, (m, id) => 'src="' + ((images || {})[id] || '') + '"');
  s = s.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  s = s.replace(/\son\w+\s*=\s*"[^"]*"/gi, '').replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  s = s.replace(/(href|src)\s*=\s*"(\s*javascript:[^"]*)"/gi, '$1="#"');
  // open links safely in a new tab
  s = s.replace(/<a\s+/gi, '<a target="_blank" rel="noopener noreferrer" ');
  return s;
};

// Lesson titles may now carry light inline formatting (colour / bold / size)
// from the editor toolbar. Render stored HTML inline where formatting should
// show; strip tags to plain text where a string is required.
const lessonPlainText = (s) => isLessonHtml(s) ? String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : (s || '');
const lessonInlineHtml = (s) => isLessonHtml(s)
  ? React.createElement('span', { dangerouslySetInnerHTML: { __html: sanitizeLessonHtml(s) } })
  : (s || '');
if (typeof window !== 'undefined') { window.lessonPlainText = lessonPlainText; window.lessonInlineHtml = lessonInlineHtml; }

// One-time stylesheet for rendered rich lesson bodies.
(() => {
  if (typeof document === 'undefined' || document.getElementById('lesson-rich-style')) return;
  const st = document.createElement('style'); st.id = 'lesson-rich-style';
  st.textContent = '.lesson-rich-body img{max-width:100%;border-radius:8px;margin:4px;display:inline-block;vertical-align:middle;border:1px solid var(--border)}.lesson-rich-body ul,.lesson-rich-body ol{margin:6px 0;padding-left:24px}.lesson-rich-body li{margin:2px 0}.lesson-rich-body div{margin:2px 0}.lesson-rich-body h1{font-size:20px;font-weight:700;margin:10px 0 4px}.lesson-rich-body h2{font-size:17px;font-weight:700;margin:9px 0 4px}.lesson-rich-body h3{font-size:15px;font-weight:600;margin:8px 0 3px}.lesson-rich-body blockquote{border-left:3px solid var(--accent);margin:6px 0;padding:2px 12px;color:var(--ink-2)}.lesson-rich-body a{color:var(--accent);text-decoration:underline}.lesson-rich-body hr{border:none;border-top:1px solid var(--border);margin:10px 0}';
  document.head.appendChild(st);
})();

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
    km:'ការសង្គ្រោះបឋម (ភាគ២-៣)', en:'First Aid (Part 2–3) · CPR',
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
    goal_km:'ឡើង-ចុះ និងរៀបចំឥរិយាបថត្រឹមត្រូវ ដោយគិតពីសុវត្ថិភាព', goal_en:'Safe boarding and a correct driving posture',
    teach_km:['វិធីឡើងជិះ · ចេញដំណើរ · ឈប់','វិធីលៃកៅអី · បញ្ឆេះម៉ាស៊ីន','ការប្ដូរលេខ · បង្វិលចង្កូត','វិធីរំលត់ម៉ាស៊ីន · ចុះពីរថយន្ត'], teach_en:['Boarding, starting and stopping','Adjusting the seat, starting the engine','Gear changing and steering','Switching off and getting out'],
    points_km:['ពិនិត្យជុំវិញរថយន្តមុនឡើង','ឥរិយាបថត្រឹមត្រូវ៖ កៅអី · កញ្ចក់ · ខ្សែក្រវាត់ · លេខ N','បញ្ឆេះ៖ ហ្វ្រាំង/ឃ្លាច់ → N → បញ្ឆេះ','ចេញ៖ ហ្គាស + ឃ្លាច់ពាក់កណ្ដាល · សញ្ញា · ត្រួតពិនិត្យ','រំលត់៖ ហ្វ្រាំងដៃ → N → បិទសញ្ញា → រំលត់ → R'], points_en:['Walk-around check before boarding','Correct posture: seat, mirrors, seatbelt, N','Start: brake/clutch to N then ignition','Move off: gas + half-clutch, signal, check','Stop engine: handbrake to N, signal off, off, R'],
    cautions_km:['ធ្វើឲ្យសិស្សយល់ថា "ហេតុអ្វីត្រូវពិនិត្យ?"','ឈប់៖ លឿន ហ្វ្រាំង→ឃ្លាច់→ហ្វ្រាំង · យឺត ឃ្លាច់→ហ្វ្រាំង','ប្ដូរលេខ៖ ត្រួតពិនិត្យពេលឈប់ រួចអនុវត្តលើផ្លូវត្រង់','ចុះ៖ ដោះខ្សែក្រវាត់ → មើលក្រោយ → បើកទ្វារបន្តិច → មើលម្ដងទៀត'], cautions_en:['Make the learner understand WHY we check','Stop: fast brake-clutch-brake, slow clutch-brake','Gears: check when stopped, practise on straights','Exit: unbelt, look back, crack door, check again'],
    guideLoc:'TH',
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
    goal_km:'យល់មុខងារឧបករណ៍បញ្ជា និងប្រើប្រាស់ត្រឹមត្រូវ', goal_en:'Understand and correctly use the driving controls',
    teach_km:['យន្តការរថយន្ត និងឧបករណ៍បញ្ជា','វិធីបញ្ឆេះម៉ាស៊ីន','ការប្ដូរលេខ · បង្វិលចង្កូត'], teach_en:['Vehicle mechanism and controls','Starting the engine','Gear change and steering'],
    points_km:['បញ្ឆេះ៖ ហ្វ្រាំង/ឃ្លាច់ → N → បញ្ឆេះ','ការប្ដូរលេខត្រឹមត្រូវ','រំលត់៖ ហ្វ្រាំងដៃ → N → បិទសញ្ញា → រំលត់ → R'], points_en:['Start: brake/clutch to N then ignition','Correct gear changing','Off: handbrake to N, signal off, off, R'],
    cautions_km:['ប្ដូរលេខ៖ ត្រួតពិនិត្យពេលឈប់ រួចអនុវត្តលើផ្លូវត្រង់','យល់ AT (P·R·N·D) និង MT (ឃ្លាច់ + លេខ)'], cautions_en:['Gears: check when stopped, practise on straights','Know AT (P/R/N/D) and MT (clutch + gears)'],
    guideLoc:'TH',
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
    goal_km:'ចេញដំណើរ និងឈប់តាមលំដាប់ត្រឹមត្រូវ ដោយរលូន', goal_en:'Start and stop smoothly in the correct sequence',
    teach_km:['ការចេញដំណើរ · ការឈប់','ការប្ដូរលេខ'], teach_en:['Starting and stopping','Gear changing'],
    points_km:['ចេញ៖ ហ្គាស + ឃ្លាច់ពាក់កណ្ដាល · សញ្ញា · ត្រួតពិនិត្យ','ឈប់៖ លំដាប់តាមល្បឿន'], points_en:['Move off: gas + half-clutch, signal, check','Stop: sequence according to speed'],
    cautions_km:['លឿន៖ ហ្វ្រាំង→ឃ្លាច់→ហ្វ្រាំង · យឺត៖ ឃ្លាច់→ហ្វ្រាំង','ឈប់ត្រង់បន្ទាត់ មិនលើស'], cautions_en:['Fast: brake-clutch-brake · slow: clutch-brake','Stop at the line, not past it'],
    guideLoc:'TH',
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
    goal_km:'បង្កើន បន្ថយ និងរក្សាល្បឿនឲ្យសមស្រប', goal_en:'Raise, lower and maintain an appropriate speed',
    teach_km:['ប្រតិបត្តិមូលដ្ឋាន លើផ្លូវត្រង់','ការប្ដូរលេខ (ដល់លេខ ៤)','ការរក្សា និងលៃល្បឿន','ការបង្វិលចង្កូត'], teach_en:['Basic operation on the straight','Gear changing (up to 4th)','Maintaining and adjusting speed','Steering'],
    points_km:['បង្កើន-បន្ថយល្បឿនលើផ្លូវត្រង់ (ប្រើហ្វ្រាំងឲ្យច្បាស់)','ហ្គាស ON / OFF','បត់ស្ដាំ-ឆ្វេង (ចង្កូត + ទិសមើល)','Uturn (ចង្កូត និងការនាំទិសមើល)'], points_en:['Accelerate/brake on the straight (use brakes firmly)','Accelerator ON / OFF','Left/right turns (steering + eyes)','U-turn (steering, eye guidance)'],
    cautions_km:['បើមានញាប់ញ័រ ត្រូវរកមូលហេតុ និងកែ','បន្ថយល្បឿនឲ្យបានមុនបត់'], cautions_en:['If wobbly, find the cause and correct it','Slow down well before turning'],
    guideLoc:'ផ្លូវហាណូយ / ផ្លូវរុស្ស៊ី',
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
    goal_km:'រក្សាទីតាំង និងគន្លងត្រឹមត្រូវលើផ្លូវត្រង់ និងពេលបង្វិលចង្កូត', goal_en:'Keep the correct position and path on straights and when steering',
    teach_km:['ទីតាំង និងគន្លងធ្វើដំណើរ','ការបង្វិលចង្កូត'], teach_en:['Road position and path','Steering'],
    points_km:['រក្សាគន្លងកណ្ដាល លើផ្លូវត្រង់','ការនាំទិសមើល (目線) ពេលបង្វិលចង្កូត'], points_en:['Keep a central line on the straight','Eye guidance (mesen) when steering'],
    cautions_km:['បើមានញាប់ញ័រ ត្រូវរកមូលហេតុ និងកែ'], cautions_en:['If wobbly, find the cause and correct it'],
    guideLoc:'ផ្លូវហាណូយ / ផ្លូវរុស្ស៊ី',
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
    goal_km:'បង្កើតល្បឿន និងបង្វិលចង្កូតសមស្របនឹងកម្រិតកោង', goal_en:'Match speed and steering to the sharpness of the curve',
    teach_km:['អារម្មណ៍ទំហំរថយន្ត និងចម្ងាយ','ចំណុចងងឹត (死角) របស់រថយន្ត','ភាពខុសគ្នាកង់ក្នុង (内輪差)','ការបើកបរតាមកោង · ការឈប់បណ្ដោះអាសន្ន'], teach_en:['Sense of the car size and distance','The vehicle blind spots','Inner-wheel difference (uchiwasa)','Cornering and the temporary stop'],
    points_km:['ទីតាំងកង់ · ការវាស់ទទឹងរថយន្ត','គម្លាតចំហៀង៖ ចូលជិត ~៧០ ស.ម','ល្បឿន និងបរិមាណបង្វិលចង្កូតសមស្រប','ហ្វ្រាំងជាដំណាក់ៗ (断続)'], points_en:['Tyre position, judging the width','Side clearance: edge in to ~70cm','Right speed and steering amount','Intermittent braking'],
    cautions_km:['ឲ្យសិស្សគិត៖ ពេលណាត្រូវប្រុងកង់ក្នុង?','ឈប់បណ្ដោះអាសន្ន៖ ក្នុង ១ ម៉ែត្រមុនបន្ទាត់ឈប់','មិនត្រួតពិនិត្យពេលកំពុងផ្លាស់ទី'], cautions_en:['Ask when to watch the inner wheel','Temporary stop: within 1m before the line','Do not check while still moving'],
    guideLoc:'裏 (ផ្លូវក្រោយ)',
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
    goal_km:'ជ្រើសលេខតាមជម្រាល និងចេញដំណើរដោយមិនរអិលថយ', goal_en:'Pick the gear for the slope and start without rolling back',
    teach_km:['ការចេញដំណើរលើផ្លូវឡើងទ្រេត','ការបើកបរលើផ្លូវចុះទ្រេត'], teach_en:['Uphill hill-start','Driving downhill'],
    points_km:['ចេញលើផ្លូវទ្រេតដោយមិនរអិលថយ','ការសម្រេចប្រើហ្វ្រាំងដៃ','ចុះ៖ ប្រើ Engine brake'], points_en:['Start on a slope without rolling back','Judging when to use the handbrake','Downhill: use engine braking'],
    cautions_km:['ចុះទ្រេត៖ មិនប្រើឃ្លាច់ (ប្រើ Engine brake)'], cautions_en:['Downhill: no clutch, rely on engine braking'],
    guideLoc:'HIKARI',
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
    goal_km:'ថយក្រោយដោយល្បឿនសមស្រប និងត្រួតពិនិត្យសុវត្ថិភាព', goal_en:'Reverse at a proper speed with safety checks',
    teach_km:['អារម្មណ៍រថយន្តពេលថយក្រោយ','ចតឆ្នាស (縦列) · បង្វិលទិស','ចេញ-ចូលពីគែមផ្លូវ'], teach_en:['Feel of the car when reversing','Parallel park and direction change','Leaving and stopping at the kerb'],
    points_km:['ថយក្រោយ៖ ត្រួតពិនិត្យ + ភាពខុសកង់ក្រៅ (外輪差)','ចេញ៖ ត្រៀម → ហ្វ្រាំងដៃ → សញ្ញាស្ដាំ → ពិនិត្យ → ចេញ → បិទសញ្ញា','ឈប់នៅគែម៖ សញ្ញាឆ្វេង → ចូលជិត (ក្នុង ៣០ ស.ម ពីបន្ទាត់ស)','រំលត់៖ ហ្វ្រាំងដៃ → N → បិទសញ្ញា → រំលត់ → R'], points_en:['Reverse: check + outer-wheel difference','Depart: ready, handbrake, right signal, check, go','Kerb stop: left signal, edge in within 30cm','Off: handbrake to N, signal off, off, R'],
    cautions_km:['ពិនិត្យ​ភាព​ខុស​កង់​ក្រៅ​ឡើងវិញ','ចង្អុលចុងរថយន្តឲ្យត្រូវនឹងបង្គោល'], cautions_en:['Review the outer-wheel difference','Line the nose up with the pole'],
    guideLoc:'',
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
    goal_km:'ឆ្លងផ្លូវចង្អៀត ដោយល្បឿន ទីតាំង និងការបកក្រោយត្រឹមត្រូវ', goal_en:'Pass narrow roads with correct speed, position and turn-around',
    teach_km:['ការបើកបរល្បឿនយឺត','ការបង្កើតល្បឿនតិចតួច','ការថយក្រោយ (មូលដ្ឋាន)'], teach_en:['Low-speed driving','Making a very low creep speed','Reversing (basics)'],
    points_km:['រក្សាឃ្លាច់ពាក់កណ្ដាល · ឃ្លាច់ជាដំណាក់ៗ (~2-3 គម/ម)','វិនិច្ឆ័យ៖ ឆ្លងបាន ឬមិនបាន (បើគ្មានគម្លាត ៥០ ស.ម → ឈប់)','ឥរិយាបថពេលថយ៖ មើលពីបង្អួចក្រោយ និងកៅអីបើកបរ'], points_en:['Hold half-clutch, feathered clutch (~2-3 km/h)','Judge if it fits (no 50cm gap then stop)','Reverse posture: rear window vs seat view'],
    cautions_km:['ល្បឿនលឿនពេក = មិនល្អ','យល់ភាពខុសកង់ក្រៅ (外輪差)'], cautions_en:['Too fast is not acceptable','Understand the outer-wheel difference'],
    guideLoc:'TH',
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
    goal_km:'ជ្រើសគន្លង និងប្ដូរគន្លង ជាមួយការត្រួតពិនិត្យសុវត្ថិភាព', goal_en:'Select and change lanes with proper safety checks',
    teach_km:['ការផ្លាស់ប្ដូរផ្លូវ','ការឆ្លងចំណុចប្រសព្វ','ចំណុចប្រសព្វមើលមិនច្បាស់'], teach_en:['Changing course','Passing intersections','Poor-visibility intersections'],
    points_km:['ផ្លាស់ផ្លូវ៖ សកម្មភាពក្រោយត្រួតពិនិត្យ','ឆ្លងប្រសព្វ៖ ត្រៀមហ្វ្រាំង · ពេលវេលាត្រួតពិនិត្យ','ចូលផ្លូវអាទិភាព៖ វិធីត្រួតពិនិត្យ'], points_en:['Change: act after checking','Intersection: cover brake, timing of checks','Entering a priority road: how to check'],
    cautions_km:['កុំត្រួតពិនិត្យ និងបញ្ជាព្រមគ្នា','ប្រសព្វមើលមិនច្បាស់៖ ទោនមុខ ពង្រីករង្វង់ត្រួតពិនិត្យ'], cautions_en:['Do not check and steer at the same moment','Poor visibility: lean forward, widen the scan'],
    guideLoc:'裏道 / Aeon 2',
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
    goal_km:'អានស្ថានភាពឧបសគ្គទាន់ពេល និងឆ្លើយតបសមស្រប', goal_en:'Read obstacles early and respond appropriately',
    teach_km:['វិធីចៀសឧបសគ្គ','ការការពារអ្នកថ្មើរជើង','ការវិនិច្ឆ័យ និងលំដាប់'], teach_en:['How to avoid obstacles','Protecting pedestrians','Judgement and sequence'],
    points_km:['លំដាប់៖ មើលរថយន្តផ្ទុយ → សញ្ញា → ត្រួតពិនិត្យ → សញ្ញា → ត្រួតពិនិត្យ','គម្លាតឧបសគ្គ៖ ៥០ ស.ម – ១ ម','គម្លាតអ្នកថ្មើរជើង៖ ១ – ១.៥ ម'], points_en:['Sequence: oncoming, signal, check, signal, check','Obstacle clearance: 50cm to 1m','Pedestrian clearance: 1 to 1.5m'],
    cautions_km:['ពេលទៅមិនបាន៖ ឈប់ឲ្យមានចន្លោះ ~២ ដងប្រវែងរថយន្ត','គម្លាតប្រែប្រួលតាមទិសអ្នកថ្មើរជើង'], cautions_en:['If blocked, stop leaving ~2 car-lengths','Clearance varies with pedestrian facing'],
    guideLoc:'TH',
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
    goal_km:'អានភ្លើងសញ្ញា និងផ្លាកបានលឿន ហើយអនុវត្តតាម', goal_en:'Quickly read signals and signs and follow them',
    teach_km:['ការយល់ភ្លើងសញ្ញា','ការត្រួតពិនិត្យសុវត្ថិភាព'], teach_en:['Reading traffic signals','Safety confirmation'],
    points_km:['ស្គាល់ប្រភេទ៖ ពណ៌ · ព្រួញ','ទស្សន៍ទាយពេលប្ដូរ៖ ភ្លើងអ្នកថ្មើរជើង · រយៈពេលភ្លើងបៃតង','ការប្រើកញ្ចក់ · មើលផ្ទាល់ (目視)'], points_en:['Know the types: colours, arrows','Predict changes: pedestrian light, green length','Using mirrors and direct eye check'],
    cautions_km:['យល់ថា កញ្ចក់ឃើញអ្វី និងត្រូវមើលអ្វី','ចេះមើលក្រោយពេលបើកបរធម្មតា (ទម្លាប់)'], cautions_en:['Understand what mirrors show and what to look for','Build the habit of rear checks while driving'],
    guideLoc:'ជុំវិញ',
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
    goal_km:'ឆ្លងចំណុចប្រសព្វ (ត្រង់/ឆ្វេង/ស្ដាំ) ដោយប្រុងប្រយ័ត្ន ល្បឿន និងវិធីសុវត្ថិភាព', goal_en:'Cross intersections (straight/left/right) with care, safe speed and method',
    teach_km:['វិធីបត់ស្ដាំ','វិធីបត់ឆ្វេង','ការឆ្លងចំណុចប្រសព្វ'], teach_en:['How to turn right','How to turn left','Passing through intersections'],
    points_km:['បត់ស្ដាំ៖ ចូលជិតបន្ទាត់កណ្ដាល','បត់ឆ្វេង៖ ចូលជិត ~៧០ ស.ម · បត់តូច','លំដាប់៖ ត្រួតពិនិត្យ → សញ្ញា → ត្រួតពិនិត្យ → ផ្លាស់ផ្លូវ → ពិនិត្យ (巻き込み)','ត្រួតពិនិត្យ៖ កញ្ចក់ + មើលផ្ទាល់ (ចំណុចងងឹត)'], points_en:['Right: move in near the centre line','Left: edge in to ~70cm, tight turn','Seq: check, signal, check, change, blind-spot check','Check: mirrors + direct eye (blind spots)'],
    cautions_km:['ការមើលផ្ទាល់ច្រើនតែធូររលុង → ត្រូវធ្វើឲ្យម៉ត់ចត់','យល់ន័យ និងសារៈសំខាន់នៃការពិនិត្យ 巻き込み (កិនកង់)'], cautions_en:['Direct checks tend to get lazy, keep them strict','Understand the meaning of the blind-spot (makikomi) check'],
    guideLoc:'裏',
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
    goal_km:'បញ្ជាក់ថាបានស្ទាត់ជំនាញទីលាន មុនឡើងដំណាក់កាលទី២', goal_en:'Confirm in-yard skills before moving to Stage 2',
    teach_km:['ការបើកបររួម (総合運転)','ការវាយតម្លៃ (みきわめ)'], teach_en:['Comprehensive driving','Assessment (mikiwame)'],
    points_km:['ភ្ជាប់គ្រប់ជំនាញទីលាន','ត្រូវដល់កម្រិត "ល្អ" ទើបឡើងដំណាក់កាលទី២'], points_en:['Combine all in-yard skills','Reach a good level to move to Stage 2'],
    cautions_km:['បើមិនទាន់ → ហ្វឹកហាត់បន្ថែម (補習)'], cautions_en:['If not ready, extra practice (hoshu)'],
    guideLoc:'TH',
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
    goal_km:'រៀបចំ និងប្រុងប្រយ័ត្នត្រឹមត្រូវ មុនចេញផ្លូវសាធារណៈ', goal_en:'Prepare and take proper precautions before public-road driving',
    teach_km:['ការរៀបចំ និងប្រុងប្រយ័ត្ន មុនចេញផ្លូវសាធារណៈ'], teach_en:['Preparation and care before public-road driving'],
    points_km:['ពិនិត្យរថយន្ត និងឯកសារមុនចេញ','យល់ភាពខុសរវាងទីលាន និងផ្លូវពិត','រក្សាចម្ងាយ និងល្បឿនសុវត្ថិភាព'], points_en:['Check the car and documents before leaving','Know the difference between yard and real road','Keep safe distance and speed'],
    cautions_km:['ប្រុងចរាចរណ៍ច្រើនជាងក្នុងទីលាន','ត្រៀមខ្លួនផ្លូវចិត្ត'], cautions_en:['More traffic awareness than in the yard','Be mentally prepared'],
    guideLoc:'ផ្លូវសាធារណៈ',
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
    goal_km:'អានស្ថានភាពចរាចរណ៍ និងបើកបរឲ្យសមស្របនឹងលំហូរ', goal_en:'Read the traffic and drive to match its flow',
    teach_km:['ការបើកបរស្របតាមលំហូរចរាចរណ៍'], teach_en:['Driving with the traffic flow'],
    points_km:['អានស្ថានភាពចរាចរណ៍ ហើយសម្របល្បឿន','រក្សាចម្ងាយសុវត្ថិភាព'], points_en:['Read the traffic and adjust speed','Keep a safe following distance'],
    cautions_km:['កុំបើកលឿន ឬយឺតពេក ធៀបនឹងលំហូរ'], cautions_en:['Do not drive too fast or too slow for the flow'],
    guideLoc:'ផ្លូវសាធារណៈ',
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
    goal_km:'ជ្រើសទីតាំងសមស្រប និងប្ដូរគន្លងទាន់ពេលដោយសុវត្ថិភាព', goal_en:'Choose a suitable position and change lanes safely and in time',
    teach_km:['ទីតាំងសមស្រប','ការផ្លាស់ប្ដូរគន្លង'], teach_en:['Appropriate position','Lane changing'],
    points_km:['ជ្រើសទីតាំងតាមរាងផ្លូវ','ប្ដូរគន្លងទាន់ពេល ដោយសញ្ញា + ត្រួតពិនិត្យ'], points_en:['Choose position by the road shape','Change lanes in time with signal + check'],
    cautions_km:['ត្រួតពិនិត្យចំណុចងងឹតមុនប្ដូរ'], cautions_en:['Check the blind spot before changing'],
    guideLoc:'ផ្លូវសាធារណៈ',
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
    goal_km:'អានអ្នកថ្មើរជើងទាន់ពេល និងផ្ដល់សុវត្ថិភាពក្នុងការឆ្លងកាត់', goal_en:'Read pedestrians early and let them pass safely',
    teach_km:['ការការពារអ្នកថ្មើរជើង និងអ្នកដទៃ'], teach_en:['Protecting pedestrians and others'],
    points_km:['អានអ្នកថ្មើរជើងទាន់ពេល','គម្លាតអ្នកថ្មើរជើង៖ ១ – ១.៥ ម'], points_en:['Read pedestrians early','Pedestrian clearance: 1 to 1.5m'],
    cautions_km:['គម្លាតប្រែប្រួលតាមទិសអ្នកថ្មើរជើង','ផ្ដល់អាទិភាពពេលឆ្លងផ្លូវ'], cautions_en:['Clearance varies with the pedestrian facing','Give priority at crossings'],
    guideLoc:'',
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
    goal_km:'អានស្ថានភាពផ្លូវ និងចរាចរណ៍ ហើយបើកបរឲ្យសមស្រប', goal_en:'Read road and traffic conditions and drive accordingly',
    teach_km:['ការបើកបរស្របតាមស្ថានភាពផ្លូវ និងចរាចរណ៍'], teach_en:['Driving adapted to road and traffic conditions'],
    points_km:['អានស្ថានភាព (រាងផ្លូវ · ចរាចរណ៍ · អាកាសធាតុ)','សម្របល្បឿន និងទីតាំង','ទស្សន៍ទាយ និងឆ្លើយតប'], points_en:['Read conditions (road shape, traffic, weather)','Adapt speed and position','Anticipate and respond'],
    cautions_km:['ផ្លាស់ប្ដូរតាមស្ថានភាពពិត មិនតឹងរ៉ឹង'], cautions_en:['Adjust to the real situation, not rigidly'],
    guideLoc:'ផ្លូវសាធារណៈ',
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
    goal_km:'ចតឆ្នាស និងបង្វិលទិស ដោយត្រឹមត្រូវ', goal_en:'Parallel park and change direction correctly',
    teach_km:['ចតឆ្នាស (縦列)','បង្វិលទិស / ចូលយានដ្ឋាន','ការចូលជិត (幅寄せ)'], teach_en:['Parallel parking','Direction change / garaging','Edging in'],
    points_km:['ថយក្រោយ៖ ត្រួតពិនិត្យ + ភាពខុសកង់ក្រៅ (外輪差)','ចង្អុលចុងរថយន្តឲ្យត្រូវនឹងបង្គោល'], points_en:['Reverse: check + outer-wheel difference','Line the nose up with the pole'],
    cautions_km:['ថយយឺតៗ ត្រួតពិនិត្យជុំវិញ'], cautions_en:['Reverse slowly, check all around'],
    guideLoc:'',
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
    goal_km:'ហ្វ្រាំងបន្ទាន់ឲ្យបានប្រកបដោយសុវត្ថិភាព និងគ្រប់គ្រងបាន', goal_en:'Perform a safe, controlled emergency stop',
    teach_km:['ការហ្វ្រាំងបន្ទាន់'], teach_en:['Emergency braking'],
    points_km:['ហ្វ្រាំងឲ្យខ្លាំង និងគ្រប់គ្រងបាន','រក្សាចង្កូតត្រង់'], points_en:['Brake hard but controlled','Keep the steering straight'],
    cautions_km:['អនុវត្តលើកន្លែងសុវត្ថិភាព','យល់ចម្ងាយឈប់'], cautions_en:['Practise in a safe area','Understand the stopping distance'],
    guideLoc:'',
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
    goal_km:'កំណត់ផ្លូវ ដោយខ្លួនឯង និងបើកបរដោយប្រុងចរាចរណ៍ផ្សេង', goal_en:'Set your own route and drive aware of others',
    teach_km:['ការកំណត់ផ្លូវ ដោយខ្លួនឯង','ការបើកបររួម (រួមទាំងថយក្រោយ)'], teach_en:['Setting your own route','Comprehensive driving (incl. reversing)'],
    points_km:['រៀបចំផ្លូវ ដោយខ្លួនឯង','ប្រុងចរាចរណ៍ផ្សេង បើកបរដោយសកម្ម'], points_en:['Plan the route yourself','Drive proactively, aware of others'],
    cautions_km:['មើលឆ្ងាយ រៀបចំមុន','សម្រេចចិត្តដោយខ្លួនឯង'], cautions_en:['Look far, prepare early','Make decisions independently'],
    guideLoc:'ផ្លូវសាធារណៈ',
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
    goal_km:'បើកបរលើផ្លូវល្បឿនលឿន ដោយរក្សាចម្ងាយ និងល្បឿនសុវត្ថិភាព', goal_en:'Drive on expressways keeping safe speed and distance',
    teach_km:['ការបើកបរលើផ្លូវល្បឿនលឿន'], teach_en:['Expressway driving'],
    points_km:['រក្សាល្បឿន និងចម្ងាយសុវត្ថិភាព','ចូល-ចេញ ដោយសញ្ញា + ត្រួតពិនិត្យ'], points_en:['Keep safe speed and distance','Enter/exit with signal + check'],
    cautions_km:['ប្រុងល្បឿនខ្ពស់ · មើលឆ្ងាយ'], cautions_en:['Mind the high speed, look far ahead'],
    guideLoc:'ផ្លូវល្បឿនលឿន',
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
    goal_km:'ទស្សន៍ទាយគ្រោះថ្នាក់ទាន់ពេល និងជ្រើសសកម្មភាពចៀសវាង', goal_en:'Predict hazards in time and choose avoiding actions',
    teach_km:['ការទស្សន៍ទាយគ្រោះថ្នាក់','ការទស្សន៍ទាយសកម្មភាពអ្នកដទៃ','សកម្មភាពសុវត្ថិភាពផ្អែកលើការទស្សន៍ទាយ'], teach_en:['Predicting hazards','Predicting others actions','Safe action based on prediction'],
    points_km:['រកគ្រោះថ្នាក់ដែលមើលមិនឃើញ (潜在的)','ដកហ្គាស · ត្រៀមហ្វ្រាំង','កុំចៀសគ្រោះថ្នាក់ដោយចង្កូតតែម្យ៉ាង'], points_en:['Find hidden, potential hazards','Ease off gas, cover the brake','Do not dodge danger by steering alone'],
    cautions_km:['ភ្ជាប់ជាមួយមេរៀនទ្រឹស្ដី (学科)','មើលឆ្ងាយ ទស្សន៍ទាយជានិច្ច'], cautions_en:['Links to the theory (gakka) lessons','Look far ahead and always anticipate'],
    guideLoc:'',
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
    goal_km:'បញ្ជាក់ថាបានស្ទាត់ជំនាញផ្លូវពិត មុនប្រឡងបញ្ចប់', goal_en:'Confirm public-road skills before the graduation exam',
    teach_km:['ការវាយតម្លៃ មុនប្រឡងបញ្ចប់ (みきわめ)'], teach_en:['Assessment before the graduation exam'],
    points_km:['បើកបរសុវត្ថិភាព និងរលូន ដោយសកម្មភាព','ប្រតិបត្តិនឹងន · ត្រួតពិនិត្យម៉ត់ចត់ · វិនិច្ឆ័យស្ថានភាព'], points_en:['Drive safely and smoothly, proactively','Stable operation, strict checks, good judgement'],
    cautions_km:['ផ្ដោត៖ ផ្លូវចង្អៀត · ចតឆ្នាស · ផ្លូវរថភ្លើង · ជម្រាល · អាទិភាព · របៀបរង់ចាំបត់ស្ដាំ · ហ្វ្រាំង/ហ្គាសបន្ទាន់'], cautions_en:['Focus: narrow road, parallel park, crossing, slope, priority, right-turn waiting, sudden brake/accel'],
    guideLoc:'',
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

  // ───────── 第2段階 · additional driver topics (AT / roundabout / situation) ──
  {
    id:'pt-39', no:'技能AT', ja:'AT車の運転', stage:2, mins:12,
    km:'ការបើកបររថយន្តអូតូម៉ាទិច (AT)', en:'Driving an Automatic (AT)',
    goal_km:'យល់លក្ខណៈ AT និងបើកបរដោយសុវត្ថិភាព', goal_en:'Understand AT characteristics and drive safely',
    teach_km:['ការបើកបររថយន្ត AT','លក្ខណៈ AT និងគ្រោះថ្នាក់'],
    teach_en:['Driving an AT car','AT characteristics and their risks'],
    points_km:['ប្រតិបត្តិមូលដ្ឋាន៖ ហ្គាស និងហ្វ្រាំង','លៃល្បឿនដោយហ្គាស/ហ្វ្រាំង','ការឆ្លងកម្ពស់ (段差)'],
    points_en:['Basic operation: accelerator and brake','Adjust speed with gas/brake','Crossing steps/bumps'],
    cautions_km:['បង្រៀនរួមទាំងគ្រោះថ្នាក់ (creep · ច្រឡំហ្គាស/ហ្វ្រាំង)','យល់ភាពខុសពី MT'],
    cautions_en:['Teach the risks too (creep, gas/brake mix-up)','Understand how it differs from MT'],
    guideLoc:'',
    body_km:`ការបើកបររថយន្តអូតូម៉ាទិច (AT車):

• គ្មានឃ្លាច់ — គ្រប់គ្រងដោយហ្គាស និងហ្វ្រាំង
• P (ចត) · R (ថយ) · N (អព្យាក្រឹត) · D (ទៅមុខ)
• ប្រុងបាតុភូត creep (រថយន្តរើឆ្ពោះទៅមុខឯង)
• កុំច្រឡំហ្គាស និងហ្វ្រាំង`,
    body_en:`Driving an automatic (AT):

• No clutch — controlled with gas and brake
• P (park) · R (reverse) · N (neutral) · D (drive)
• Watch for creep (the car edges forward by itself)
• Never mix up the accelerator and the brake`,
  },
  {
    id:'pt-40', no:'技能特別', ja:'環状交差点（特別項目）', stage:2, mins:12,
    km:'ចំណុចប្រសព្វរង្វង់មូល (特別)', en:'Roundabout (Special Item)',
    goal_km:'ឆ្លងចំណុចប្រសព្វរង្វង់មូលបានត្រឹមត្រូវ', goal_en:'Navigate a roundabout correctly',
    teach_km:['ចំណុចដែលមិនសូវជួប (環状交差点)'],
    teach_en:['Places rarely experienced (roundabouts)'],
    points_km:['វិធីឆ្លងចំណុចប្រសព្វរង្វង់មូល','ផ្ដល់អាទិភាពរថយន្តក្នុងរង្វង់'],
    points_en:['How to pass a roundabout','Give priority to cars already in the ring'],
    cautions_km:['ជាកន្លែងមិនសូវមានបទពិសោធន៍ → ប្រុងប្រយ័ត្ន'],
    cautions_en:['Unfamiliar place — proceed with extra care'],
    guideLoc:'',
    body_km:`ចំណុចប្រសព្វរង្វង់មូល (環状交差点):

• រថយន្តក្នុងរង្វង់មានអាទិភាព
• ចូលពេលមានចន្លោះសុវត្ថិភាព
• បើកសញ្ញាពេលនឹងចេញ`,
    body_en:`Roundabout (environmental intersection):

• Cars already in the ring have priority
• Enter only when there is a safe gap
• Signal when you are about to exit`,
  },
  {
    id:'pt-41', no:'技能状況', ja:'状況対応（先読み）', stage:2, mins:14,
    km:'ការឆ្លើយតបនឹងស្ថានភាព (先読み)', en:'Situation Response (Reading Ahead)',
    goal_km:'អានស្ថានភាពមុន និងឆ្លើយតបទាន់ពេល', goal_en:'Read situations ahead and respond in time',
    teach_km:['ការអានមុន (先読み)','ការឆ្លើយតបនឹងស្ថានភាព'],
    teach_en:['Reading ahead','Responding to the situation'],
    points_km:['ទស្សន៍ទាយស្ថានភាពខាងមុខ','រៀបចំសកម្មភាពទុកជាមុន'],
    points_en:['Anticipate the situation ahead','Prepare your action in advance'],
    cautions_km:['ភ្ជាប់ជាមួយការទស្សន៍ទាយគ្រោះថ្នាក់'],
    cautions_en:['Links with hazard prediction'],
    guideLoc:'ផ្លូវសាធារណៈ',
    body_km:`ការឆ្លើយតបនឹងស្ថានភាព (状況対応 · 先読み):

• មើលឆ្ងាយ អានស្ថានភាពខាងមុខ
• ទស្សន៍ទាយសកម្មភាពរថយន្ត/មនុស្សដទៃ
• រៀបចំហ្វ្រាំង និងល្បឿនទុកជាមុន`,
    body_en:`Situation response (reading ahead):

• Look far, read the situation ahead
• Predict what other cars/people will do
• Prepare braking and speed in advance`,
  },

  // ───────── 第3段階 · AI（外免切替） · in-yard course (Stage 3) ─────────
  // Foreign-licence conversion (外免切替) practical course — 13 items.
  // Each carries a short goal_km/goal_en (指導内容と習得目標) shown in the
  // lesson picker and the PDF record book.
  {
    id:'pt-26', no:'AI1', ja:'コース概要', stage:3, mins:12,
    km:'ទិដ្ឋភាពទូទៅនៃវគ្គ', en:'Course Overview',
    goal_km:'យល់ពីទីលានហ្វឹកហ្វឺនទាំងមូល', goal_en:'Understand the whole in-yard course',
    teach_km:['ទិដ្ឋភាពទូទៅនៃទីលានហ្វឹកហ្វឺន'], teach_en:['Overview of the practice yard'],
    points_km:['ស្គាល់ផ្លូវ ចំណុចចេញ-ចូល','ស្គាល់ផ្នែកសំខាន់ៗ (ចង្អៀត · ជម្រាល · រថភ្លើង)'], points_en:['Learn the route and entry/exit points','Learn key sections (narrow, slope, crossing)'],
    cautions_km:['យល់លំដាប់វគ្គ មុនប្រឡងប្ដូរប័ណ្ណ'], cautions_en:['Understand the flow before the conversion exam'],
    guideLoc:'TH',
    body_km:`ស្គាល់ទីលានហ្វឹកហ្វឺន (ដំណាក់កាលទី៣ · AI):

• ស្គាល់ផ្លូវ ចំណុចចេញ-ចូល និងទិសដៅ
• ស្គាល់ផ្នែកសំខាន់ៗ (ផ្លូវចង្អៀត ជម្រាល ផ្លូវរថភ្លើង)
• យល់លំដាប់វគ្គ មុនប្រឡងប្ដូរប័ណ្ណបរទេស`,
    body_en:`Get to know the practice course (Stage 3 · AI):

• Learn the route, entry/exit points and direction
• Learn key sections (narrow road, slope, crossing)
• Understand the test flow before the licence-conversion exam`,
  },
  {
    id:'pt-27', no:'AI2', ja:'加減速', stage:3, mins:12,
    km:'ការបង្កើន និងបន្ថយល្បឿន', en:'Acceleration & Deceleration',
    goal_km:'បើកបរមានចង្វាក់ បង្កើន-បន្ថយច្បាស់លាស់', goal_en:'Crisp, well-timed speed changes',
    teach_km:['ការបង្កើន និងបន្ថយល្បឿន មានចង្វាក់'], teach_en:['Crisp acceleration and deceleration'],
    points_km:['បង្កើនម៉ឺងម៉ាត់ · បន្ថយទាន់ពេល','រក្សាល្បឿនស្មើ'], points_en:['Accelerate firmly, slow in time','Keep a steady speed'],
    cautions_km:['បើមានញាប់ញ័រ ត្រូវរកមូលហេតុ និងកែ'], cautions_en:['If wobbly, find the cause and correct it'],
    guideLoc:'裏',
    body_km:`បង្កើន-បន្ថយល្បឿនឲ្យមានចង្វាក់:

• បង្កើនល្បឿនម៉ឺងម៉ាត់នៅកន្លែងត្រូវ
• បន្ថយល្បឿនទាន់ពេលមុនផ្លូវកោង/ចំណុច
• រក្សាល្បឿនស្មើ មិនញាប់ញ័រ`,
    body_en:`Crisp acceleration and deceleration:

• Accelerate firmly where appropriate
• Slow down in time before curves / points
• Keep a steady speed, no jerky changes`,
  },
  {
    id:'pt-28', no:'AI3', ja:'踏切', stage:3, mins:12,
    km:'ការឆ្លងកាត់ផ្លូវរថភ្លើង', en:'Railway Level Crossing',
    goal_km:'វិធីឆ្លងកាត់ផ្លូវរថភ្លើងត្រឹមត្រូវ', goal_en:'Correct method to cross a railway',
    teach_km:['ការឆ្លងផ្លូវរថភ្លើង'], teach_en:['Railway level crossing'],
    points_km:['ឈប់ពេញមុនផ្លូវរថភ្លើង','បើកកញ្ចក់ ស្ដាប់-មើល ឆ្វេង-ស្ដាំ','ឆ្លងម្ដងទៅ មិនឈប់ពាក់កណ្ដាល'], points_en:['Full stop before the crossing','Open window, look and listen both ways','Cross in one go, never stop halfway'],
    cautions_km:['កុំប្ដូរលេខពេលកំពុងឆ្លង'], cautions_en:['Do not change gear while crossing'],
    guideLoc:'',
    body_km:`ការឆ្លងផ្លូវរថភ្លើងឲ្យបានត្រឹមត្រូវ:

• ឈប់ពេញមុនផ្លូវរថភ្លើង
• បើកកញ្ចក់ ស្ដាប់-មើល ឆ្វេង-ស្ដាំ
• ឆ្លងម្ដងទៅមិនឈប់ពាក់កណ្ដាល`,
    body_en:`Cross a railway correctly:

• Make a full stop before the crossing
• Open the window, look and listen both ways
• Cross in one go — never stop halfway`,
  },
  {
    id:'pt-29', no:'AI4', ja:'坂道', stage:3, mins:13,
    km:'ការបើកបរលើជម្រាល', en:'Slope Driving',
    goal_km:'វិធីចេញដំណើរលើផ្លូវទ្រេត ដោយមិនរអិលថយ', goal_en:'Hill start without rolling back',
    teach_km:['ការចេញដំណើរលើផ្លូវឡើងទ្រេត','ការបើកបរលើផ្លូវចុះទ្រេត'], teach_en:['Uphill hill-start','Driving downhill'],
    points_km:['ចេញលើផ្លូវទ្រេតដោយមិនរអិលថយ','ការសម្រេចប្រើហ្វ្រាំងដៃ'], points_en:['Start on a slope without rolling back','Judge when to use the handbrake'],
    cautions_km:['ចុះទ្រេត៖ ប្រើ Engine brake'], cautions_en:['Downhill: use engine braking'],
    guideLoc:'HIKARI',
    body_km:`ការចេញដំណើរលើជម្រាល:

• ឈប់ត្រង់ចំណុច ទប់ដោយហ្វ្រាំង
• សម្របហ្វ្រាំង-ហ្គាស ចេញឡើងដោយមិនរអិលថយ
• រក្សាល្បឿននឹងនរលើផ្លូវទ្រេត`,
    body_en:`Starting on a slope:

• Stop at the mark, hold with the brake
• Balance brake/throttle, move off without rolling back
• Keep a steady speed on the incline`,
  },
  {
    id:'pt-30', no:'AI5', ja:'狭路', stage:3, mins:14,
    km:'ការឆ្លងកាត់ផ្លូវតូចចង្អៀត', en:'Narrow Road',
    goal_km:'ល្បឿន ទីតាំង និងការបកក្រោយសមស្រប', goal_en:'Proper speed, position & turn-around',
    teach_km:['ការឆ្លងផ្លូវចង្អៀត','ការថយក្រោយ (មូលដ្ឋាន)'], teach_en:['Passing narrow roads','Reversing (basics)'],
    points_km:['រក្សាឃ្លាច់ពាក់កណ្ដាល (~2-3 គម/ម)','វិនិច្ឆ័យ ឆ្លងបាន/មិនបាន (គ្មាន ៥០ ស.ម → ឈប់)'], points_en:['Hold half-clutch (~2-3 km/h)','Judge if it fits (no 50cm gap then stop)'],
    cautions_km:['ល្បឿនលឿនពេក = មិនល្អ','យល់ភាពខុសកង់ក្រៅ'], cautions_en:['Too fast is not acceptable','Understand the outer-wheel difference'],
    guideLoc:'TH',
    body_km:`ការឆ្លងផ្លូវតូចចង្អៀត (S / クランク):

• ល្បឿនយឺត គ្រប់គ្រងចង្កូតម៉ត់ចត់
• រក្សាទីតាំងកណ្ដាលផ្លូវ
• បើកាំបិទ → បកក្រោយ (切り返し) ដោយសុវត្ថិភាព`,
    body_en:`Passing narrow roads (S-curve / crank):

• Slow speed, precise steering control
• Keep a central road position
• If blocked → reverse-adjust (切り返し) safely`,
  },
  {
    id:'pt-31', no:'AI6', ja:'確認', stage:3, mins:11,
    km:'ការត្រួតពិនិត្យសុវត្ថិភាព', en:'Safety Confirmation',
    goal_km:'ត្រួតពិនិត្យ ៣៦០° ពេលផ្លាស់ប្ដូរផ្លូវ', goal_en:'360° checks when changing course',
    teach_km:['ការត្រួតពិនិត្យសុវត្ថិភាព'], teach_en:['Safety confirmation'],
    points_km:['មើលកញ្ចក់ + បែរមើលចំណុចងងឹត (死角)','បើកសញ្ញាមុនរាល់ការផ្លាស់ប្ដូរ','ត្រួតពិនិត្យមុន-ក្រោយ គ្រប់ជំហាន'], points_en:['Mirrors + turn to see blind spots','Signal before every change','Confirm front and rear at each step'],
    cautions_km:['យល់ថា កញ្ចក់ឃើញអ្វី និងត្រូវមើលអ្វី','ការមើលផ្ទាល់ត្រូវម៉ត់ចត់'], cautions_en:['Know what mirrors show and what to look for','Keep direct checks strict'],
    guideLoc:'ជុំវិញ',
    body_km:`ការត្រួតពិនិត្យសុវត្ថិភាព:

• មើលកញ្ចក់ + បែរមើលចំណុចងងឹត (死角)
• បើកសញ្ញាមុនរាល់ការផ្លាស់ប្ដូរ
• ត្រួតពិនិត្យមុន-ក្រោយ គ្រប់ជំហាន`,
    body_en:`Safety confirmation:

• Check mirrors + turn to see blind spots (死角)
• Signal before every change
• Confirm front and rear at each step`,
  },
  {
    id:'pt-32', no:'AI7', ja:'右折', stage:3, mins:13,
    km:'ការបត់ស្ដាំ', en:'Turning Right',
    goal_km:'ប្រុងប្រយ័ត្ន ល្បឿន និងវិធីត្រឹមត្រូវនៅចំណុចប្រសព្វ', goal_en:'Care, speed & method at intersections',
    teach_km:['វិធីបត់ស្ដាំ'], teach_en:['How to turn right'],
    points_km:['ចូលជិតបន្ទាត់កណ្ដាល','លំដាប់៖ ត្រួតពិនិត្យ → សញ្ញា → ត្រួតពិនិត្យ → ផ្លាស់ → ពិនិត្យអាទិភាព','កញ្ចក់ + មើលផ្ទាល់ (ចំណុចងងឹត)'], points_en:['Move in near the centre line','Seq: check, signal, check, change, priority check','Mirrors + direct eye (blind spots)'],
    cautions_km:['ប្រុងចរាចរណ៍ផ្ទុយ និងអ្នកថ្មើរជើង'], cautions_en:['Watch oncoming traffic and pedestrians'],
    guideLoc:'裏',
    body_km:`ការបត់ស្ដាំនៅចំណុចប្រសព្វ:

• បើកសញ្ញាមុន ចូលទីតាំងបត់ស្ដាំ
• ប្រុងចរាចរណ៍ផ្ទុយ និងអ្នកថ្មើរជើង
• បត់ដោយល្បឿនសមស្រប តាមផ្លូវត្រឹមត្រូវ`,
    body_en:`Turning right at an intersection:

• Signal early, move to the right-turn position
• Watch oncoming traffic and pedestrians
• Turn at a safe speed on the correct path`,
  },
  {
    id:'pt-33', no:'AI8', ja:'左折', stage:3, mins:13,
    km:'ការបត់ឆ្វេង', en:'Turning Left',
    goal_km:'ប្រុងប្រយ័ត្ន ល្បឿន និងវិធីត្រឹមត្រូវនៅចំណុចប្រសព្វ', goal_en:'Care, speed & method at intersections',
    teach_km:['វិធីបត់ឆ្វេង'], teach_en:['How to turn left'],
    points_km:['ចូលជិត ~៧០ ស.ម · បត់តូច','លំដាប់៖ ត្រួតពិនិត្យ → សញ្ញា → ត្រួតពិនិត្យ → ផ្លាស់ → ពិនិត្យ 巻き込み'], points_en:['Edge in ~70cm, tight turn','Seq: check, signal, check, change, blind-spot check'],
    cautions_km:['ប្រុងម៉ូតូ/កង់ខាងឆ្វេង (巻き込み)'], cautions_en:['Watch bikes on the left (makikomi)'],
    guideLoc:'裏',
    body_km:`ការបត់ឆ្វេងនៅចំណុចប្រសព្វ:

• ចូលជិតគែមឆ្វេង បើកសញ្ញាមុន
• ប្រុងម៉ូតូ/កង់ និងអ្នកថ្មើរជើងខាងឆ្វេង (巻き込み)
• បត់តូច ជិតគែម ដោយល្បឿនយឺត`,
    body_en:`Turning left at an intersection:

• Move close to the left edge, signal early
• Watch for bikes/pedestrians on the left (巻き込み)
• Take a tight line near the edge at low speed`,
  },
  {
    id:'pt-34', no:'AI9', ja:'進路変更', stage:3, mins:12,
    km:'ការផ្លាស់ប្ដូរផ្លូវ', en:'Lane / Course Change',
    goal_km:'វិធីត្រួតពិនិត្យសុវត្ថិភាពពេលផ្លាស់ប្ដូរ និងបត់', goal_en:'Safety checks when changing/turning',
    teach_km:['ការផ្លាស់ប្ដូរផ្លូវ'], teach_en:['Changing course'],
    points_km:['បើកសញ្ញា → មើលកញ្ចក់ → ចំណុចងងឹត','ផ្លាស់ពេលមានចន្លោះសុវត្ថិភាព'], points_en:['Signal, check mirror, blind spot','Change only when the gap is safe'],
    cautions_km:['កុំត្រួតពិនិត្យ និងបញ្ជាព្រមគ្នា'], cautions_en:['Do not check and steer at the same moment'],
    guideLoc:'裏',
    body_km:`ការផ្លាស់ប្ដូរផ្លូវ ដោយសុវត្ថិភាព:

• បើកសញ្ញា → មើលកញ្ចក់ → ចំណុចងងឹត
• ផ្លាស់ថ្នមៗ ពេលមានចន្លោះសុវត្ថិភាព
• បញ្ចប់សញ្ញា ក្រោយផ្លាស់រួច`,
    body_en:`Changing course safely:

• Signal → check mirror → blind spot
• Move gently only when the gap is safe
• Cancel the signal after completing`,
  },
  {
    id:'pt-35', no:'AI10', ja:'障害物', stage:3, mins:12,
    km:'ការដោះស្រាយឧបសគ្គ', en:'Dealing with Obstacles',
    goal_km:'អានស្ថានភាពមុន និងឆ្លើយតបសមស្រប', goal_en:'Read the situation early and respond',
    teach_km:['ការចៀសឧបសគ្គ'], teach_en:['Avoiding obstacles'],
    points_km:['លំដាប់៖ រថយន្តផ្ទុយ → សញ្ញា → ត្រួតពិនិត្យ → សញ្ញា → ត្រួតពិនិត្យ','គម្លាតឧបសគ្គ៖ ៥០ ស.ម – ១ ម'], points_en:['Seq: oncoming, signal, check, signal, check','Obstacle clearance: 50cm to 1m'],
    cautions_km:['ពេលទៅមិនបាន៖ ឈប់ឲ្យមានចន្លោះ'], cautions_en:['If blocked, stop leaving room'],
    guideLoc:'TH',
    body_km:`ការឆ្លងកាត់ឧបសគ្គ:

• អានឧបសគ្គពីចម្ងាយ ទស្សន៍ទាយ
• បើកសញ្ញា ចៀសដោយរក្សាចម្ងាយសុវត្ថិភាព
• ប្រុងចរាចរណ៍ផ្ទុយ មុនចៀស`,
    body_en:`Passing obstacles:

• Read obstacles from afar, anticipate
• Signal and go around keeping safe clearance
• Check oncoming traffic before pulling out`,
  },
  {
    id:'pt-36', no:'AI11', ja:'バック（後退）', stage:3, mins:15,
    km:'ការដកថយ (ចត និងប្ដូរទិស)', en:'Reversing (Park & Turn-around)',
    goal_km:'ចតស្របគ្នា ប្ដូរទិស ចូលយានដ្ឋាន និងបកក្រោយ', goal_en:'Parallel, direction change, garaging, turn-around',
    teach_km:['ការដកថយ · ចតឆ្នាស · បង្វិលទិស'], teach_en:['Reversing, parallel park, direction change'],
    points_km:['ថយក្រោយ៖ ត្រួតពិនិត្យ + ភាពខុសកង់ក្រៅ','ចង្អុលចុងរថយន្តឲ្យត្រូវនឹងបង្គោល'], points_en:['Reverse: check + outer-wheel difference','Line the nose up with the pole'],
    cautions_km:['ថយយឺតៗ ត្រួតពិនិត្យជុំវិញ'], cautions_en:['Reverse slowly, check all around'],
    guideLoc:'',
    body_km:`ការដកថយ ដោយត្រឹមត្រូវ:

• បង្កើតល្បឿនយឺត ត្រួតពិនិត្យក្រោយ
• ចតស្របគ្នា (縦列) និងចូលយានដ្ឋាន (車庫入れ)
• ប្ដូរទិស (方向変換) + បកក្រោយ (切り返し)`,
    body_en:`Reversing correctly:

• Keep a slow speed, check behind
• Parallel park (縦列) and garage the car (車庫入れ)
• Direction change (方向変換) + reverse-adjust (切り返し)`,
  },
  {
    id:'pt-37', no:'AI12', ja:'コース走行', stage:3, mins:16,
    km:'ការបើកបរពេញវគ្គ', en:'Full Course Driving',
    goal_km:'បើកបរពេញទីលានតាមផ្លូវកំណត់ ដោយរលូន', goal_en:'Drive the full course smoothly',
    teach_km:['ការបើកបរពេញទីលាន'], teach_en:['Driving the full course'],
    points_km:['ភ្ជាប់គ្រប់ជំនាញ','រក្សាទីតាំង ល្បឿន និងការត្រួតពិនិត្យ'], points_en:['Combine all skills','Keep position, speed and checks'],
    cautions_km:['អនុវត្តដូចប្រឡងពិត'], cautions_en:['Practise as in the real exam'],
    guideLoc:'TH',
    body_km:`ការបើកបរពេញវគ្គ:

• ភ្ជាប់គ្រប់ជំនាញ បើកបរពេញទីលាន
• រក្សាទីតាំង ល្បឿន និងការត្រួតពិនិត្យ
• អនុវត្តដូចប្រឡងពិត`,
    body_en:`Driving the full course:

• Combine all skills across the whole course
• Keep position, speed and safety checks
• Practise as if in the real exam`,
  },
  {
    id:'pt-38', no:'AI13', ja:'教習効果の確認（みきわめ）', stage:3, mins:15,
    km:'ការវាយតម្លៃប្រសិទ្ធភាព (បញ្ចប់វគ្គ AI)', en:'Effectiveness Check (AI Stage Assessment)',
    goal_km:'បញ្ជាក់ថាបានស្ទាត់ មុនប្រឡងប្ដូរប័ណ្ណបរទេស', goal_en:'Confirm readiness before the conversion exam',
    teach_km:['ការវាយតម្លៃ មុនប្រឡងប្ដូរប័ណ្ណ (外免切替)'], teach_en:['Assessment before the conversion exam'],
    points_km:['គ្រូត្រួតពិនិត្យជំនាញទីលានទាំងអស់','ត្រូវដល់កម្រិត "ល្អ" ទើបប្រឡង'], points_en:['Instructor checks all in-yard skills','Must reach a good level to take the exam'],
    cautions_km:['បើមិនទាន់ → ហ្វឹកហាត់បន្ថែម'], cautions_en:['If not ready, extra practice'],
    guideLoc:'TH',
    body_km:`ការវាយតម្លៃ មុនប្រឡងប្ដូរប័ណ្ណបរទេស (外免切替):

• គ្រូត្រួតពិនិត្យជំនាញទីលានទាំងអស់
• ត្រូវដល់កម្រិត "ល្អ" ទើបអាចប្រឡង
• បើមិនទាន់ → ហ្វឹកហាត់បន្ថែម`,
    body_en:`Assessment before the licence-conversion exam (外免切替):

• Instructor checks all in-yard skills
• Must reach "good" level to take the exam
• If not ready → extra practice`,
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
  const { tr, lang, role } = useAppActions();
  const [, forceG] = React.useReducer(x => x + 1, 0);

  // Instructor teaching guide (指導内容 / 指導事項 / 留意事項). Instructor-facing by
  // default; the instructor can tick "allow students to view" per lesson.
  const isStaff = role === 'admin' || role === 'instructor';
  const guideParts = [
    { key:'teach',    km:'មាតិកាបង្រៀន',            jp:'指導内容', c:'var(--accent)', items: tr(lesson.teach_km,    lesson.teach_en) },
    { key:'points',   km:'ចំណុចបង្រៀន',             jp:'指導事項', c:'#6246C9',       items: tr(lesson.points_km,   lesson.points_en) },
    { key:'cautions', km:'ចំណុចត្រូវប្រុងប្រយ័ត្ន', jp:'留意事項', c:'#C98A0A',       items: tr(lesson.cautions_km, lesson.cautions_en) },
  ];
  const hasGuide = guideParts.some(p => Array.isArray(p.items) && p.items.length);
  const guideVisible = isStaff || lesson.guideStudent;
  const toggleGuideStudent = () => {
    lesson.guideStudent = !lesson.guideStudent;
    if (window.__persistLessonsLib) window.__persistLessonsLib();
    forceG();
  };
  const renderGuide = () => {
    if (!hasGuide || !guideVisible) return null;
    return (
      <div style={{ marginTop:18, border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', background:'var(--surface-muted)', borderBottom:'1px solid var(--border)' }}>
          <Icon name="book" size={14}/>
          <span style={{ fontSize:13, fontWeight:700 }}>{tr('ការណែនាំបង្រៀន','Teaching guide')}</span>
          <span style={{ fontSize:10, color:'var(--ink-3)', fontFamily:'"JetBrains Mono",monospace' }}>· {tr('សម្រាប់គ្រូ','Instructor')}</span>
          {lesson.guideLoc && <span style={{ marginLeft:'auto', fontSize:11, color:'var(--ink-3)', background:'var(--surface)', border:'1px solid var(--border)', padding:'2px 9px', borderRadius:99, whiteSpace:'nowrap' }}>📍 {lesson.guideLoc}</span>}
        </div>
        {isStaff && (
          <label style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 13px', borderBottom:'1px solid var(--border)', cursor:'pointer', fontSize:12.5 }}>
            <input type="checkbox" checked={!!lesson.guideStudent} onChange={toggleGuideStudent} style={{ width:16, height:16, accentColor:'var(--accent)', cursor:'pointer' }}/>
            <span style={{ color:'var(--ink-2)' }}>{tr('អនុញ្ញាតឲ្យសិស្សមើលឃើញ','Allow students to view')}</span>
          </label>
        )}
        <div style={{ padding:'12px 13px', display:'flex', flexDirection:'column', gap:13 }}>
          {guideParts.filter(p => Array.isArray(p.items) && p.items.length).map(p => (
            <div key={p.key}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:p.c, flexShrink:0 }}/>
                <span style={{ fontSize:12.5, fontWeight:700, color:p.c }}>{p.km}</span>
                <span style={{ fontSize:9.5, color:'var(--ink-3)', fontFamily:'"JetBrains Mono",monospace' }}>{p.jp}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4, paddingLeft:2 }}>
                {p.items.map((it,i)=>(
                  <div key={i} style={{ display:'flex', gap:7, fontSize:13, color:'var(--ink-2)', lineHeight:1.55 }}>
                    <span style={{ color:p.c, flexShrink:0 }}>•</span><span>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBody = (text) => {
    const body = text || '';
    // Rich HTML body (from the WYSIWYG editor) — render directly.
    if (isLessonHtml(body)) {
      return <div className="lesson-rich-body" style={{ fontSize: 13, lineHeight: 1.75 }}
        dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(body, lesson.images) }}/>;
    }
    // Legacy markdown body — render line by line.
    return body.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 8 }}/>;
    // Image: ![](url) — url may be a data URL (legacy) or an "img:ID" token
    // resolved from the lesson's images map.
    const imgM = line.trim().match(/^!\[[^\]]*\]\(([^)]+)\)$/);
    if (imgM) {
      let src = imgM[1];
      if (src.startsWith('img:')) src = (lesson.images || {})[src.slice(4)] || '';
      return src ? <img key={i} src={src} alt="" style={{ maxWidth:'100%', borderRadius:8, margin:'8px 0', display:'block', border:'1px solid var(--border)' }}/> : null;
    }
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
  };

  return (
    <div style={{
      border: `1px solid ${done ? 'var(--good)' : 'var(--border)'}`,
      borderRadius: 12, overflow: 'hidden', background: 'var(--surface)',
      transition: 'border-color .15s',
    }}>
      <button onClick={() => setOpen(true)} style={{
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
          <div style={{ fontSize: 14, fontWeight: 600 }}>{lessonInlineHtml(tr(lesson.km, lesson.en))}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {lesson.no && <span style={{ fontFamily:'"JetBrains Mono",monospace', color:'var(--accent)', fontWeight:600 }}>{lesson.no}</span>}
            {lesson.ja && <span style={{ color:'var(--ink-2)' }}>{lesson.ja}</span>}
            <span>· {lesson.mins} {tr('នាទី', 'min')}</span>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0 }}>
          <path d="M9 6l6 6-6 6"/>
        </svg>
      </button>

      {/* Reading popup — sticky header + footer, scrollable body */}
      <Modal open={open} onClose={() => setOpen(false)} width={720}>
        <div style={{ display:'flex', flexDirection:'column', maxHeight: window.innerWidth < 700 ? '86vh' : '84vh' }}>
          <div style={{ flexShrink:0, position:'sticky', top:0, background:'var(--surface)', padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', gap:12, zIndex:2 }}>
            <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, background: done ? 'var(--good)' : 'var(--surface-muted)', color: done ? '#fff' : 'var(--ink-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {done ? <Icon name="check" size={18} stroke={2.5}/> : <Icon name="book" size={18}/>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:17, fontWeight:700, fontFamily:'var(--font-display)', lineHeight:1.25 }}>{lessonInlineHtml(tr(lesson.km, lesson.en))}</div>
              <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:3, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                {lesson.no && <span style={{ fontFamily:'"JetBrains Mono",monospace', color:'var(--accent)', fontWeight:600 }}>{lesson.no}</span>}
                {lesson.ja && <span style={{ color:'var(--ink-2)' }}>{lesson.ja}</span>}
                <span>· {lesson.mins} {tr('នាទី', 'min')}</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} title={tr('បិទ','Close')} style={{ flexShrink:0, width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', color:'var(--ink-2)', fontSize:16, lineHeight:1 }}>✕</button>
          </div>
          <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'14px 20px 18px', fontSize:14, lineHeight:1.8 }}>
            {renderBody(tr(lesson.body_km, lesson.body_en))}
            {renderGuide()}
          </div>
          <div style={{ flexShrink:0, position:'sticky', bottom:0, background:'var(--surface)', borderTop:'1px solid var(--border)', padding:'12px 20px', display:'flex', justifyContent:'flex-end', gap:8 }}>
            <Btn kind={done ? 'ghost' : 'primary'} onClick={() => { onToggle(lesson.id); setOpen(false); }}>
              {done ? tr('សម្គាល់ថាមិនទាន់អាន', 'Mark as unread') : tr('សម្គាល់ថាបានអាន ✓', 'Mark as read ✓')}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ── ExerciseCard ──────────────────────────────────────────────────────────────
const ExerciseCard = ({ exercise, done, onDone }) => {
  const [open, setOpen] = React.useState(false);
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const { tr } = useAppActions();

  const isForm = !!exercise.formUrl;
  const total  = (exercise.questions || []).length;
  const score  = submitted ? (exercise.questions || []).filter((q, i) => answers[i] === q.answer).length : null;
  const passed = score === total;
  const formEmbedUrl = (u) => { try { const url = new URL(u); url.searchParams.set('embedded', 'true'); return url.toString(); } catch (e) { return u; } };

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
            {isForm ? 'Google Form' : `${total} ${tr('សំណួរ', 'questions')}`}
          </div>
        </div>
        {done && <Badge tone="good">{tr('ឆ្លងកាត់', 'Passed')}</Badge>}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? 'rotate(90deg)' : '', transition: 'transform .15s', flexShrink: 0 }}>
          <path d="M9 6l6 6-6 6"/>
        </svg>
      </button>

      {open && isForm && (
        <div style={{ padding: '10px 14px 16px', borderTop: '1px solid var(--border)' }}>
          <iframe src={formEmbedUrl(exercise.formUrl)} title={tr(exercise.km, exercise.en)}
            style={{ width: '100%', height: 520, border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}/>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <a href={exercise.formUrl} target="_blank" rel="noopener noreferrer" style={{
              padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>↗ {tr('បើក​ក្នុង​ផ្ទាំង​ថ្មី', 'Open in new tab')}</a>
            {!done && (
              <button onClick={() => onDone(exercise.id)} style={{
                padding: '9px 14px', borderRadius: 8, border: 'none',
                background: 'var(--good)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{tr('សម្គាល់​ថា​បាន​ធ្វើ', 'Mark as done')}</button>
            )}
          </div>
        </div>
      )}
      {open && !isForm && (
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
          {isOne ? tr('ដំណាក់កាលទី ១','Stage 1 · 第一段階') : tr('ដំណាក់កាលទី ២','Stage 2 · 第二段階')}
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
    { id: 'theory',    km: 'ទ្រឹស្ដី',  en: 'Theory · 学科',    icon: 'book'  },
    { id: 'practical', km: 'អនុវត្ត',  en: 'Practical · 技能', icon: 'car'   },
    { id: 'tests',     km: 'ការប្រឡង', en: 'Exams · 検定',     icon: 'check' },
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

// ───────── SST · 技能（トラック運転者） — Japanese key-point summaries ─────────
const SST_TEXTS = [
  {
    id:'st-01', no:'SST1', ja:'人々の生活や仕事を支えるトラック', stage:1, mins:12,
    km:'តួនាទីរបស់ឡានដឹកទំនិញ', en:'The Role of Trucks',
    body_km:`■ トラックの役割
・国内貨物輸送のトン数ベース約90％、トンキロベース約50％を担う物流の主役。
・食料・日用品・原材料をドア・ツー・ドアで運ぶライフライン。ドライバーはエッセンシャルワーカー。
■ 輸送が止まったら
・24時間以内に店頭から食品が消え、ジャストインタイム生産は操業停止、燃料・医薬品供給も麻痺。
■ 免許と事業区分
・車両総重量・最大積載量・乗車定員で区分（普通/準中型/中型/大型）。免許条件を厳守。
・緑ナンバー＝事業用（有償・厳格な運行管理）、白ナンバー＝自家用。
【キーワード】国内貨物輸送、ライフライン、ジャストインタイム、車両総重量、緑/白ナンバー。`,
    body_en:`■ トラックの役割
・国内貨物輸送のトン数ベース約90％、トンキロベース約50％を担う物流の主役。
・食料・日用品・原材料をドア・ツー・ドアで運ぶライフライン。ドライバーはエッセンシャルワーカー。
■ 輸送が止まったら
・24時間以内に店頭から食品が消え、ジャストインタイム生産は操業停止、燃料・医薬品供給も麻痺。
■ 免許と事業区分
・車両総重量・最大積載量・乗車定員で区分（普通/準中型/中型/大型）。免許条件を厳守。
・緑ナンバー＝事業用（有償・厳格な運行管理）、白ナンバー＝自家用。
【キーワード】国内貨物輸送、ライフライン、ジャストインタイム、車両総重量、緑/白ナンバー。`,
  },
  {
    id:'st-02', no:'SST2', ja:'トラック事故の社会的影響', stage:1, mins:14,
    km:'ផលប៉ះពាល់សង្គមនៃគ្រោះថ្នាក់ឡាន', en:'Social Impact of Truck Accidents',
    body_km:`■ 重大事故の重さ
・巨大な運動エネルギー（速度の2乗に比例）により致命的な重大事故になりやすい。
・企業は信用失墜・契約解除・莫大な賠償・営業停止。運転者は民事・刑事・行政の3責任。
■ 事故の特徴
・追突事故が約5割（脇見・漫然・居眠り・車間距離不保持）。制動距離が長い。
・交差点：左折巻き込み（内輪差・左後方死角）、右直・サンキュー事故。
・健康起因事故（脳血管・心臓・SAS）→定期健診と自己申告。
■ 安全機器
・デジタコ・ドラレコで運転の癖を見える化。ヒヤリハット共有。AEBSは補助、過信禁止。
【キーワード】運動エネルギー、追突（5割）、内輪差、健康起因事故、デジタコ、ヒヤリハット。`,
    body_en:`■ 重大事故の重さ
・巨大な運動エネルギー（速度の2乗に比例）により致命的な重大事故になりやすい。
・企業は信用失墜・契約解除・莫大な賠償・営業停止。運転者は民事・刑事・行政の3責任。
■ 事故の特徴
・追突事故が約5割（脇見・漫然・居眠り・車間距離不保持）。制動距離が長い。
・交差点：左折巻き込み（内輪差・左後方死角）、右直・サンキュー事故。
・健康起因事故（脳血管・心臓・SAS）→定期健診と自己申告。
■ 安全機器
・デジタコ・ドラレコで運転の癖を見える化。ヒヤリハット共有。AEBSは補助、過信禁止。
【キーワード】運動エネルギー、追突（5割）、内輪差、健康起因事故、デジタコ、ヒヤリハット。`,
  },
  {
    id:'st-03', no:'SST3', ja:'心構え・言葉づかい・整理整頓', stage:1, mins:10,
    km:'ស្មារតី ពាក្យសម្ដី និងសណ្តាប់ធ្នាប់', en:'Mindset, Manners & Tidiness',
    body_km:`■ プロの自覚
・高い技術・完全な法規遵守・「絶対に事故を起こさない」モラル。防衛運転に徹する。急ぎ・焦りを排除。
■ 言葉づかい・身だしなみ
・企業の顔。清潔な身だしなみ、明るい挨拶、正しい敬語・接客マナー。
■ 4S活動
・整理・整頓・清掃・清潔を徹底。足元の空き缶等はペダル挟まり事故の原因。
・ダッシュボード上の荷物は映り込み・視界遮断で禁止。
【キーワード】防衛運転、安全第一、挨拶・身だしなみ、4S活動、ペダル挟まり防止、前方視界確保。`,
    body_en:`■ プロの自覚
・高い技術・完全な法規遵守・「絶対に事故を起こさない」モラル。防衛運転に徹する。急ぎ・焦りを排除。
■ 言葉づかい・身だしなみ
・企業の顔。清潔な身だしなみ、明るい挨拶、正しい敬語・接客マナー。
■ 4S活動
・整理・整頓・清掃・清潔を徹底。足元の空き缶等はペダル挟まり事故の原因。
・ダッシュボード上の荷物は映り込み・視界遮断で禁止。
【キーワード】防衛運転、安全第一、挨拶・身だしなみ、4S活動、ペダル挟まり防止、前方視界確保。`,
  },
  {
    id:'st-04', no:'SST4', ja:'安全運転の基本', stage:1, mins:16,
    km:'មូលដ្ឋានគ្រឹះនៃការបើកបរសុវត្ថិភាព', en:'Safe Driving Basics',
    body_km:`■ 飲酒・速度
・飲酒運転は絶対禁止。乗務前アルコール検知、宿酔にも注意。
・最高速度厳守。速度2倍で衝撃力・制動距離は4倍（速度の2乗）。
■ 交差点・踏切
・一時停止は線の手前で完全停止し左右2回以上目視。踏切は手前で停止、窓を開け音を確認、閉じ込め防止。
■ 車間・ながら運転
・2秒・3秒ルール。時速60kmで3秒＝約50m。ながら運転禁止（2秒脇見で約33m無制御）。
■ 弱者・緊急車両・地形・駐停車
・横断歩道の歩行者優先（道交法38条）、側方1.5m以上。緊急車両に避譲。
・下り坂はエンジン・排気ブレーキ活用（フェード/ベーパーロック防止）、カーブはスローイン・ファストアウト。
・駐車はサイドブレーキ・ギヤ・輪止めで逸走防止。
【キーワード】飲酒禁止、速度の2乗、2秒3秒ルール、38条、フェード現象、輪止め。`,
    body_en:`■ 飲酒・速度
・飲酒運転は絶対禁止。乗務前アルコール検知、宿酔にも注意。
・最高速度厳守。速度2倍で衝撃力・制動距離は4倍（速度の2乗）。
■ 交差点・踏切
・一時停止は線の手前で完全停止し左右2回以上目視。踏切は手前で停止、窓を開け音を確認、閉じ込め防止。
■ 車間・ながら運転
・2秒・3秒ルール。時速60kmで3秒＝約50m。ながら運転禁止（2秒脇見で約33m無制御）。
■ 弱者・緊急車両・地形・駐停車
・横断歩道の歩行者優先（道交法38条）、側方1.5m以上。緊急車両に避譲。
・下り坂はエンジン・排気ブレーキ活用（フェード/ベーパーロック防止）、カーブはスローイン・ファストアウト。
・駐車はサイドブレーキ・ギヤ・輪止めで逸走防止。
【キーワード】飲酒禁止、速度の2乗、2秒3秒ルール、38条、フェード現象、輪止め。`,
  },
  {
    id:'st-05', no:'SST5', ja:'運転マナーとエコドライブ', stage:1, mins:12,
    km:'មារយាទបើកបរ និង Eco-drive', en:'Driving Manners & Eco-driving',
    body_km:`■ 運転マナー
・トラックは「走る看板」。強引な割込み・あおり・威嚇クラクション・ポイ捨て厳禁。
・譲り合いの精神、サンキューハザードでスマートに。
■ エコドライブ
・CO₂削減＋燃費向上。ふんわりアクセル（5秒で時速20km）、早めのシフトアップ、定速運転。
・減速時は早めにアクセルオフで燃料カット、待機時はアイドリングストップ。
■ 運行経路
・指定運行経路（運行指示書）を厳守。勝手な迂回は高さ・重量制限や架線事故の危険。変更時は運行管理者に連絡。
【キーワード】走る看板、譲り合い、ふんわりアクセル、アイドリングストップ、運行指示書、道路制限。`,
    body_en:`■ 運転マナー
・トラックは「走る看板」。強引な割込み・あおり・威嚇クラクション・ポイ捨て厳禁。
・譲り合いの精神、サンキューハザードでスマートに。
■ エコドライブ
・CO₂削減＋燃費向上。ふんわりアクセル（5秒で時速20km）、早めのシフトアップ、定速運転。
・減速時は早めにアクセルオフで燃料カット、待機時はアイドリングストップ。
■ 運行経路
・指定運行経路（運行指示書）を厳守。勝手な迂回は高さ・重量制限や架線事故の危険。変更時は運行管理者に連絡。
【キーワード】走る看板、譲り合い、ふんわりアクセル、アイドリングストップ、運行指示書、道路制限。`,
  },
  {
    id:'st-06', no:'SST6', ja:'トラック運転者の仕事の流れ', stage:2, mins:15,
    km:'លំហូរការងាររបស់អ្នកបើកបរ', en:'Driver Work Flow',
    body_km:`■ 一日の流れ
・出勤→健康確認→日常点検→乗務前点呼→出発→荷役→休憩/途中点呼→帰社→給油・洗車→運転日報→乗務後点呼→退勤。
■ 日常点検（法定義務）
・タイヤ（空気圧・亀裂・溝）、テストハンマーでホイールナットの緩み確認（脱輪防止）、灯火類、油脂・冷却水、ブレーキ。異常は整備管理者へ報告。
■ 点呼
・乗務前：免許携帯・期限、体調、アルコール検知、運行指示受領。乗務後：異常報告・日報提出・再度アルコール検知。原則対面。
■ 異常事態
・停止＋ハザード→発炎筒・停止表示板で二次災害防止→負傷者救護（119/110）→会社報告。示談禁止。
【キーワード】乗務前後点呼、日常点検、テストハンマー、二次災害防止、発炎筒、対面点呼。`,
    body_en:`■ 一日の流れ
・出勤→健康確認→日常点検→乗務前点呼→出発→荷役→休憩/途中点呼→帰社→給油・洗車→運転日報→乗務後点呼→退勤。
■ 日常点検（法定義務）
・タイヤ（空気圧・亀裂・溝）、テストハンマーでホイールナットの緩み確認（脱輪防止）、灯火類、油脂・冷却水、ブレーキ。異常は整備管理者へ報告。
■ 点呼
・乗務前：免許携帯・期限、体調、アルコール検知、運行指示受領。乗務後：異常報告・日報提出・再度アルコール検知。原則対面。
■ 異常事態
・停止＋ハザード→発炎筒・停止表示板で二次災害防止→負傷者救護（119/110）→会社報告。示談禁止。
【キーワード】乗務前後点呼、日常点検、テストハンマー、二次災害防止、発炎筒、対面点呼。`,
  },
  {
    id:'st-07', no:'SST7', ja:'運転手が守ること', stage:2, mins:14,
    km:'អ្វីដែលអ្នកបើកបរត្រូវគោរព', en:'What Drivers Must Obey',
    body_km:`■ 法令遵守
・道交法・貨物自動車運送事業法・道路運送車両法・労基法を完全に理解しコンプライアンス徹底。
■ 過労運転防止（改善基準告示）
・連続運転4時間までに合計30分以上の休憩（1回10分以上で分割可）。拘束時間・休息期間を厳守。強い眠気は仮眠。
■ 過積載の禁止
・最大積載量超過は違法。制動距離延伸・横転・タイヤバースト・部品破損、道路/橋の破壊。
・事業者は一発行政処分、運転者は免停・取消・刑事罰、荷主にも荷主勧告。
【キーワード】コンプライアンス、連続運転4時間/休憩30分、拘束時間、過積載、荷主勧告制度。`,
    body_en:`■ 法令遵守
・道交法・貨物自動車運送事業法・道路運送車両法・労基法を完全に理解しコンプライアンス徹底。
■ 過労運転防止（改善基準告示）
・連続運転4時間までに合計30分以上の休憩（1回10分以上で分割可）。拘束時間・休息期間を厳守。強い眠気は仮眠。
■ 過積載の禁止
・最大積載量超過は違法。制動距離延伸・横転・タイヤバースト・部品破損、道路/橋の破壊。
・事業者は一発行政処分、運転者は免停・取消・刑事罰、荷主にも荷主勧告。
【キーワード】コンプライアンス、連続運転4時間/休憩30分、拘束時間、過積載、荷主勧告制度。`,
  },
  {
    id:'st-08', no:'SST8', ja:'荷崩れ防止の措置', stage:3, mins:13,
    km:'វិធានការការពារទំនិញរលំ', en:'Preventing Load Collapse',
    body_km:`■ 荷崩れの危険
・振動やGで荷崩れ→破損・偏り横転・扉突き破りで路上飛散。
■ 積付（はい付け）
・袋物＝インターロッキング積み（交差積み）、箱物＝レンガ積み/ブロック積み、隙間はエアバッグ・緩衝材で排除。
・缶・ドラムは当て木（くさび）で転がり防止。
■ 固縛
・ロープは南京結び、タイダウンベルトはねじれなく締付、角にコーナーガード、後方はラッシングバー。
■ 走行中の力
・慣性の法則：ブレーキ＝前方、カーブ＝外側（遠心力）、発進＝後方。急操作を避け強度ある固縛を。
【キーワード】荷崩れ防止、インターロッキング積み、南京結び、ラッシングバー、遠心力、慣性の法則。`,
    body_en:`■ 荷崩れの危険
・振動やGで荷崩れ→破損・偏り横転・扉突き破りで路上飛散。
■ 積付（はい付け）
・袋物＝インターロッキング積み（交差積み）、箱物＝レンガ積み/ブロック積み、隙間はエアバッグ・緩衝材で排除。
・缶・ドラムは当て木（くさび）で転がり防止。
■ 固縛
・ロープは南京結び、タイダウンベルトはねじれなく締付、角にコーナーガード、後方はラッシングバー。
■ 走行中の力
・慣性の法則：ブレーキ＝前方、カーブ＝外側（遠心力）、発進＝後方。急操作を避け強度ある固縛を。
【キーワード】荷崩れ防止、インターロッキング積み、南京結び、ラッシングバー、遠心力、慣性の法則。`,
  },
  {
    id:'st-09', no:'SST9', ja:'パレットの活用と偏荷重の防止', stage:3, mins:13,
    km:'ការប្រើ Pallet និងទប់ការលំអៀងទម្ងន់', en:'Pallets & Uneven Loading',
    body_km:`■ パレット輸送
・フォークで大量積降ろし、荷役時間短縮。オーバーハング（はみ出し）は禁止。ストレッチフィルム/バンドで一体化。使用前に割れ点検。
■ 偏荷重の危険
・左右偏り→低速でも横転。前後偏り（後ろ下がり）→前輪の接地力低下でアンダーステア。
・軸重は10トン超禁止。中心線基準に左右均等・前後バランス。
■ 積載重量と配置
・最大積載量を再確認。下重上軽（重い物を下の中心）で低重心化、横転抑止。
【キーワード】パレット、オーバーハング禁止、偏荷重、軸重10トン、下重上軽、低重心化。`,
    body_en:`■ パレット輸送
・フォークで大量積降ろし、荷役時間短縮。オーバーハング（はみ出し）は禁止。ストレッチフィルム/バンドで一体化。使用前に割れ点検。
■ 偏荷重の危険
・左右偏り→低速でも横転。前後偏り（後ろ下がり）→前輪の接地力低下でアンダーステア。
・軸重は10トン超禁止。中心線基準に左右均等・前後バランス。
■ 積載重量と配置
・最大積載量を再確認。下重上軽（重い物を下の中心）で低重心化、横転抑止。
【キーワード】パレット、オーバーハング禁止、偏荷重、軸重10トン、下重上軽、低重心化。`,
  },
  {
    id:'st-10', no:'SST10', ja:'労働災害の防止', stage:3, mins:13,
    km:'ការបង្ការគ្រោះថ្នាក់ការងារ', en:'Preventing Labour Accidents',
    body_km:`■ 荷役中が危険
・労災の約7割は運転中でなく積込み・荷降ろし中に発生。
■ 保護具（PPE）
・安全靴、ヘルメット（顎紐）、作業手袋を必ず着用。半袖・短パン・サンダルは禁止。
■ 墜落・転落防止
・荷台からの飛び降り禁止。昇降ステップ使用、三点支持を徹底。雨天・冬は滑りに注意。
■ 機械操作
・フォークリフトは有資格者のみ、視界不良時は後進走行、爪の下に人を入れない。
・パワーゲートは挟まれ・落下・転落に注意、安全区域に立ちキャスターロック。
【キーワード】労災（7割は荷役）、安全靴/ヘルメット、三点支持、フォークリフト有資格、テールゲート。`,
    body_en:`■ 荷役中が危険
・労災の約7割は運転中でなく積込み・荷降ろし中に発生。
■ 保護具（PPE）
・安全靴、ヘルメット（顎紐）、作業手袋を必ず着用。半袖・短パン・サンダルは禁止。
■ 墜落・転落防止
・荷台からの飛び降り禁止。昇降ステップ使用、三点支持を徹底。雨天・冬は滑りに注意。
■ 機械操作
・フォークリフトは有資格者のみ、視界不良時は後進走行、爪の下に人を入れない。
・パワーゲートは挟まれ・落下・転落に注意、安全区域に立ちキャスターロック。
【キーワード】労災（7割は荷役）、安全靴/ヘルメット、三点支持、フォークリフト有資格、テールゲート。`,
  },
  {
    id:'st-11', no:'SST11', ja:'KYT：交差点の走行', stage:4, mins:16,
    km:'KYT៖ ការបើកបរនៅផ្លូវប្រសព្វ', en:'KYT: Intersections',
    body_km:`危険予知トレーニング（交差点）。
■ シート1 左折巻き込み：内輪差と左後方死角。手前30mでウインカー・左端寄せ、徐行、直接目視の指差確認。
■ シート2 右折時：フロントピラーの死角、対向直進車の陰の二輪車（右直事故）。かもしれない運転、ネック振り。
■ シート3 黄信号進入：急加速も急ブレーキも危険。停止限界点を想定し「黄は停止」、構えブレーキ。
■ シート4 見通しの悪い交差点：出会い頭事故。優先でも徐行、カーブミラー確認、鼻先を出して目視。
【キーワード】左折巻き込み、内輪差、フロントピラー死角、右直事故、構えブレーキ、出会い頭。`,
    body_en:`危険予知トレーニング（交差点）。
■ シート1 左折巻き込み：内輪差と左後方死角。手前30mでウインカー・左端寄せ、徐行、直接目視の指差確認。
■ シート2 右折時：フロントピラーの死角、対向直進車の陰の二輪車（右直事故）。かもしれない運転、ネック振り。
■ シート3 黄信号進入：急加速も急ブレーキも危険。停止限界点を想定し「黄は停止」、構えブレーキ。
■ シート4 見通しの悪い交差点：出会い頭事故。優先でも徐行、カーブミラー確認、鼻先を出して目視。
【キーワード】左折巻き込み、内輪差、フロントピラー死角、右直事故、構えブレーキ、出会い頭。`,
  },
  {
    id:'st-12', no:'SST12', ja:'KYT：一般道路の走行', stage:4, mins:16,
    km:'KYT៖ ការបើកបរផ្លូវធម្មតា', en:'KYT: General Roads',
    body_km:`危険予知トレーニング（一般道路）。
■ シート5 狭い道のすれ違い：路肩崩落・脱輪、ミラー接触。待避所で先に停止、譲り合い、超低速。
■ シート6 下り坂カーブ：遠心力で横転、対向のセンターラインオーバー。手前でエンジン/排気ブレーキ、スローイン・ファストアウト。
■ シート7 横断歩道手前：停止車両の陰から飛び出し。側方通過前に必ず一時停止（38条）、ダイヤマークで減速。
■ シート8 自転車レーン：ふらつき・急な進路変更。側方間隔1.5m以上、路上駐車を先読み、無理なら追従。
■ シート9 バス停：死角からの横断・発進バス。徐行で通過、発進合図のバスを先に。
【キーワード】路肩崩落、スローイン・ファストアウト、38条一時停止、側方間隔1.5m、死角の飛び出し。`,
    body_en:`危険予知トレーニング（一般道路）。
■ シート5 狭い道のすれ違い：路肩崩落・脱輪、ミラー接触。待避所で先に停止、譲り合い、超低速。
■ シート6 下り坂カーブ：遠心力で横転、対向のセンターラインオーバー。手前でエンジン/排気ブレーキ、スローイン・ファストアウト。
■ シート7 横断歩道手前：停止車両の陰から飛び出し。側方通過前に必ず一時停止（38条）、ダイヤマークで減速。
■ シート8 自転車レーン：ふらつき・急な進路変更。側方間隔1.5m以上、路上駐車を先読み、無理なら追従。
■ シート9 バス停：死角からの横断・発進バス。徐行で通過、発進合図のバスを先に。
【キーワード】路肩崩落、スローイン・ファストアウト、38条一時停止、側方間隔1.5m、死角の飛び出し。`,
  },
  {
    id:'st-13', no:'SST13', ja:'KYT：高速道路の走行', stage:4, mins:14,
    km:'KYT៖ ការបើកបរផ្លូវល្បឿនលឿន', en:'KYT: Expressways',
    body_km:`危険予知トレーニング（高速道路）。
■ シート10 雨天：ハイドロプレーニング現象、水しぶきで視界不良。速度を20〜30km落とし、車間2倍（約150m）、滑らかな操作。
■ シート11 渋滞最後尾（サグ部）：ノーブレーキ追突・多重衝突。掲示板で減速準備、ハザード点灯、段階的（ポンピング）ブレーキ。
■ シート12 夜間：ロービーム約40mでは停止距離が足りない。落下物・故障車に注意、対向がなければハイビーム（約100m）活用。
【キーワード】ハイドロプレーニング、車間2倍、渋滞最後尾、ハザード、ポンピングブレーキ、ハイビーム活用。`,
    body_en:`危険予知トレーニング（高速道路）。
■ シート10 雨天：ハイドロプレーニング現象、水しぶきで視界不良。速度を20〜30km落とし、車間2倍（約150m）、滑らかな操作。
■ シート11 渋滞最後尾（サグ部）：ノーブレーキ追突・多重衝突。掲示板で減速準備、ハザード点灯、段階的（ポンピング）ブレーキ。
■ シート12 夜間：ロービーム約40mでは停止距離が足りない。落下物・故障車に注意、対向がなければハイビーム（約100m）活用。
【キーワード】ハイドロプレーニング、車間2倍、渋滞最後尾、ハザード、ポンピングブレーキ、ハイビーム活用。`,
  },
  {
    id:'st-14', no:'SST14', ja:'KYT：特殊環境での走行', stage:4, mins:15,
    km:'KYT៖ ការបើកបរបរិយាកាសពិសេស', en:'KYT: Special Conditions',
    body_km:`危険予知トレーニング（特殊環境）。
■ シート13 夜間雨天：蒸発現象（グレア）で歩行者が消える。中央付近に「見えない歩行者」を疑い減速、油膜除去。
■ シート14 積雪・凍結：摩擦は乾燥路の約1/10。ブラックアイスバーン、ジャックナイフ現象。急操作全面禁止、スタッドレス/チェーン、車間3〜5倍。
■ シート15 濃霧：速度感覚が麻痺。フォグランプ＋ハザードで自車位置アピール、必ずロービーム、危険なら安全退避。
■ シート16 強風：受風面積が大きく横流され・横転。橋上・トンネル出口で減速、両手（9時15分）保持、風速大なら運行見合わせ。
【キーワード】蒸発現象、ブラックアイスバーン、ジャックナイフ、濃霧フォグランプ、受風面積、両手保持。`,
    body_en:`危険予知トレーニング（特殊環境）。
■ シート13 夜間雨天：蒸発現象（グレア）で歩行者が消える。中央付近に「見えない歩行者」を疑い減速、油膜除去。
■ シート14 積雪・凍結：摩擦は乾燥路の約1/10。ブラックアイスバーン、ジャックナイフ現象。急操作全面禁止、スタッドレス/チェーン、車間3〜5倍。
■ シート15 濃霧：速度感覚が麻痺。フォグランプ＋ハザードで自車位置アピール、必ずロービーム、危険なら安全退避。
■ シート16 強風：受風面積が大きく横流され・横転。橋上・トンネル出口で減速、両手（9時15分）保持、風速大なら運行見合わせ。
【キーワード】蒸発現象、ブラックアイスバーン、ジャックナイフ、濃霧フォグランプ、受風面積、両手保持。`,
  },
  {
    id:'st-15', no:'SST15', ja:'KYT：荷役・駐車・その他', stage:4, mins:15,
    km:'KYT៖ ការផ្ទុក ចត និងផ្សេងៗ', en:'KYT: Loading, Parking & Others',
    body_km:`危険予知トレーニング（荷役・駐車）。
■ シート17 後退（バック）：後方は完全な死角。下車確認を徹底、バックカメラを過信しない、窓全開、誘導員をミラーで常時視認、見失ったら即停止、超低速。
■ シート18 傾斜地駐車：わずかな傾斜でも車両逸走。サイドブレーキ完全ロック・ギヤ確認・輪止め（歯止め）を密着設置。指差確認。
■ シート19 路上駐車の回避：右後方死角の二輪車、車陰からの飛び出し。ウインカー3秒前、対向車優先、側方間隔確保、いつでも止まれる速度。
【キーワード】後退の下車確認、誘導員視認、車両逸走、輪止め、ウインカー3秒前、車陰の飛び出し。`,
    body_en:`危険予知トレーニング（荷役・駐車）。
■ シート17 後退（バック）：後方は完全な死角。下車確認を徹底、バックカメラを過信しない、窓全開、誘導員をミラーで常時視認、見失ったら即停止、超低速。
■ シート18 傾斜地駐車：わずかな傾斜でも車両逸走。サイドブレーキ完全ロック・ギヤ確認・輪止め（歯止め）を密着設置。指差確認。
■ シート19 路上駐車の回避：右後方死角の二輪車、車陰からの飛び出し。ウインカー3秒前、対向車優先、側方間隔確保、いつでも止まれる速度。
【キーワード】後退の下車確認、誘導員視認、車両逸走、輪止め、ウインカー3秒前、車陰の飛び出し。`,
  },
  {
    id:'st-16', no:'SST16', ja:'単語表（用語集）', stage:4, mins:15,
    km:'សទ្ទានុក្រម (単語表)', en:'Glossary',
    body_km:`■ 単語表 (សទ្ទានុក្រម)

あおり運転（Aori-unten） — ការបើកបរគំរាមកំហែង ឬដេញពន្លិចឡានដទៃ
空走距離（Kūsō-kyori） — ចម្ងាយឡានរំកិលមុនពេលហ្វ្រាំងចាប់ផ្តើមស៊ី
悪天候（Akutenkō） — លក្ខខណ្ឌអាកាសធាតុអាក្រក់
当て木（Ategi） — កំណល់ឈើ (សម្រាប់ទប់ទំនិញកុំឱ្យរំកិល)
安全靴（Anzen-gutsu） — ស្បែកជើងសុវត្ថិភាព
安全第一（Anzen-daiichi） — សុវត្ថិភាពជាទីមួយ
内輪差（Nairinsa） — កាំគម្លាតរវាងកង់មុខនិងកង់ក្រោយពេលបត់
居眠り運転（Inemuri-unten） — ការបើកបរងងុយដេក
一時停止（Ichiji-teishi） — ការឈប់ជាបណ្តោះអាសន្ន (ផ្អាកឈប់តាមផ្លាកសញ្ញា)
運行管理者（Unkō-kanrija） — អ្នកគ្រប់គ្រងការធ្វើដំណើរ
運行指示書（Unkō-shijisho） — លិខិតបញ្ជាការធ្វើដំណើរ
運転日報（Unten-nippō） — របាយការណ៍បើកបរប្រចាំថ្ងៃ
エコドライブ（Eko-doraibu） — ការបើកបរសន្សំសំចៃ និងការពារបរិស្ថាន
大型免許（Ōgata-menkyo） — ប័ណ្ណបើកបរធុនធ្ងន់ (ឡានធំ)
オーバーハング（Ōbāhangu） — ការផ្ទុកទំនិញលយចេញហួសពីគែម
横転（Ōten） — ការក្រឡាប់ឡានទៅចំហៀង
過積載（Kasekisai） — ការដឹកលើសទម្ងន់កំណត់
下重上軽（Kajū-jōkei） — គោលការណ៍ «ធ្ងន់នៅក្រោម ស្រាលនៅលើ»
過労運転（Karō-unten） — ការបើកបរនឿយហត់ហួសកម្លាំង
健康起因事故（Kenkō-kiin-jiko） — គ្រោះថ្នាក់ដែលកើតពីបញ្ហាសុខភាព
交差点事故（Kōsaten-jiko） — គ្រោះថ្នាក់នៅផ្លូវប្រសព្វ
拘束時間（Kōsoku-jikan） — រយៈពេលជាប់កាតព្វកិច្ចការងារ
後方死角（Kōhō-shikaku） — ចំណុចងងឹតខាងក្រោយ
構えブレーキ（Kamae-burēki） — ការត្រៀមជើងលើហ្វ្រាំង
貨物自動車運送事業法（Kamotsu-jidōsha-unsō-jigyōhō） — ច្បាប់អាជីវកម្មដឹកជញ្ជូនទំនិញ
車間距離（Shakan-kyori） — គម្លាតសុវត្ថិភាពរវាងឡាន
死角（Shikaku） — ចំណុចងងឹតមើលមិនឃើញ (Blind Spot)
軸重（Jikujū） — ទម្ងន់ផ្ទុកលើអ័ក្សកង់
下車確認（Gesha-kakunin） — ការចុះពិនិត្យជុំវិញឡាន
ジャストインタイム（Jasuto-in-taimu） — ប្រព័ន្ធផលិតទាន់ពេលវេលា
ジャックナイフ現象（Jakku-naifu-genshō） — ឡានកន្ទុយសណ្តោងបត់ដូចកាំបិត
準中型免許（Jun-chūgata-menkyo） — ប័ណ្ណបើកបរធុនមធ្យមស្រាល
乗務前点呼（Jōmu-mae-tenko） — ការហៅឈ្មោះពិនិត្យមុនបើកបរ
乗務後点呼（Jōmu-go-tenko） — ការហៅឈ្មោះពិនិត្យក្រោយបើកបរ
徐行（Jokō） — ការបើកបរយឺតៗ (អាចឈប់ភ្លាម)
蒸発現象（Jōhatsu-genshō） — ភ្នែកមើលមិនឃើញថ្មើរជើងដោយចំណាំងពន្លឺ
白ナンバー（Shiro-nanbā） — ផ្លាកលេខស (ប្រើប្រាស់ផ្ទាល់ខ្លួន)
睡眠時無呼吸症候群（Suiminji-mukokyū-shōkōgun） — ជម្ងឺឈប់ដកដង្ហើមពេលដេក (SAS)
スローイン・ファストアウト（Surōin-fasutoauto） — «ចូលយឺត ចេញលឿន» ពេលបត់
制動距離（Seidō-kyori） — ចម្ងាយចាប់ជាន់ហ្វ្រាំងដល់ឡានឈប់
整備管理者（Seibi-kanrija） — អ្នកគ្រប់គ្រងថែទាំបច្ចេកទេស
対面点呼（Taimen-tenko） — ការហៅឈ្មោះជួបមុខផ្ទាល់
タイダウンベルト（Taidaun-beruto） — ខ្សែក្រវាត់រឹតចងទំនិញ
タイヤバースト（Taiya-bāsuto） — ការផ្ទុះកង់ឡាន
墜落・転落防止（Tsuiraku-tenraku-bōshi） — ការការពារការធ្លាក់ពីទីខ្ពស់
デジタル式運行記録計（Dejitaru-unkō-kirokukei） — ម៉ាស៊ីនកត់ត្រាធ្វើដំណើរឌីជីថល (ដេជីតាកូ)
テールゲートリフター（Tērugēto-rihutā） — កម្រាលលើកទំនិញខាងក្រោយ (Power Gate)
ドア・ツー・ドア輸送（Doa-tsū-doa-yusō） — ការដឹកជញ្ជូនពីទ្វារទៅទ្វារ
道路交通法（Dōro-kōtsūhō） — ច្បាប់ចរាចរណ៍ផ្លូវគោក
内輪差（Nairinsa） — កាំគម្លាតកង់មុខ-កង់ក្រោយពេលបត់
ながら運転（Nagara-unten） — ការបើកបរបណ្តើរធ្វើអ្វីផ្សេង (និយាយទូរស័ព្ទ)
荷崩れ（Nikazure） — ការរលំ ឬធ្លាក់ទំនិញក្នុងឡាន
日常点検（Nichijō-tenken） — ការត្រួតពិនិត្យរថយន្តប្រចាំថ្ងៃ
二日酔い（Futsuka-yoi） — អាការៈស្រវឹងសេសសល់ពីថ្ងៃមុន
脳血管疾患（Nōkekkan-shikkan） — ជម្ងឺសរសៃឈាមខួរក្បាល
ハイドロプレーニング現象（Haidoro-purēningu） — ឡានរអិលលើទឹកបាត់កម្លាំងកកិត
歯止め（Hadome） — កំណល់កង់ឡាន (ទប់ពេលចត)
漫然運転（Manzen-unten） — ការបើកបរអណ្តែតអណ្តូង ខ្វះការយកចិត្តទុកដាក់
フェード現象（Fēdo-genshō） — ហ្វ្រាំងមិនស៊ីដោយកម្ដៅឡើងខ្ពស់
ふんわりアクセル（Hunwari-akuseru） — ការជាន់ហ្គែរថ្នមៗពេលចេញដំណើរ
ブラックアイスバーン（Burakku-aisubān） — ផ្លូវកកស្រទាប់ស្តើងមើលដូចផ្លូវធម្មតា
偏荷重（Henkajū） — ការផ្ទុកទំនិញលំអៀងម្ខាង
防衛運転（Bōei-unten） — ការបើកបរការពារខ្លួន ប្រុងប្រយ័ត្នខ្ពស់
歩行者優先（Hokōsha-yūsen） — ការផ្តល់អាទិភាពដល់អ្នកថ្មើរជើង
巻き込み事故（Makikomi-jiko） — គ្រោះថ្នាក់កិនកៀរពេលឡានបត់
緑ナンバー（Midori-nanbā） — ផ្លាកលេខបៃតង (អាជីវកម្មដឹកជញ្ជូន)
無免許運転（Mumenkyo-unten） — ការបើកបរគ្មានប័ណ្ណបើកបរ
ライフライン（Raifurain） — ខ្សែជីវិត សេវាចាំបាច់ក្នុងសង្គម
ラッシングバー（Rasshingubā） — របារដែកទប់ឃាត់ទំនិញ
労働災害（Rōdō-saigai） — គ្រោះថ្នាក់ការងារ
輪止め（Wadome） — កំណល់កង់ឡាន
脇見運転（Wakimi-unten） — ការបើកបរងាកមើលឆ្វេងស្តាំ`,
    body_en:`■ 単語表 (សទ្ទានុក្រម)

あおり運転（Aori-unten） — ការបើកបរគំរាមកំហែង ឬដេញពន្លិចឡានដទៃ
空走距離（Kūsō-kyori） — ចម្ងាយឡានរំកិលមុនពេលហ្វ្រាំងចាប់ផ្តើមស៊ី
悪天候（Akutenkō） — លក្ខខណ្ឌអាកាសធាតុអាក្រក់
当て木（Ategi） — កំណល់ឈើ (សម្រាប់ទប់ទំនិញកុំឱ្យរំកិល)
安全靴（Anzen-gutsu） — ស្បែកជើងសុវត្ថិភាព
安全第一（Anzen-daiichi） — សុវត្ថិភាពជាទីមួយ
内輪差（Nairinsa） — កាំគម្លាតរវាងកង់មុខនិងកង់ក្រោយពេលបត់
居眠り運転（Inemuri-unten） — ការបើកបរងងុយដេក
一時停止（Ichiji-teishi） — ការឈប់ជាបណ្តោះអាសន្ន (ផ្អាកឈប់តាមផ្លាកសញ្ញា)
運行管理者（Unkō-kanrija） — អ្នកគ្រប់គ្រងការធ្វើដំណើរ
運行指示書（Unkō-shijisho） — លិខិតបញ្ជាការធ្វើដំណើរ
運転日報（Unten-nippō） — របាយការណ៍បើកបរប្រចាំថ្ងៃ
エコドライブ（Eko-doraibu） — ការបើកបរសន្សំសំចៃ និងការពារបរិស្ថាន
大型免許（Ōgata-menkyo） — ប័ណ្ណបើកបរធុនធ្ងន់ (ឡានធំ)
オーバーハング（Ōbāhangu） — ការផ្ទុកទំនិញលយចេញហួសពីគែម
横転（Ōten） — ការក្រឡាប់ឡានទៅចំហៀង
過積載（Kasekisai） — ការដឹកលើសទម្ងន់កំណត់
下重上軽（Kajū-jōkei） — គោលការណ៍ «ធ្ងន់នៅក្រោម ស្រាលនៅលើ»
過労運転（Karō-unten） — ការបើកបរនឿយហត់ហួសកម្លាំង
健康起因事故（Kenkō-kiin-jiko） — គ្រោះថ្នាក់ដែលកើតពីបញ្ហាសុខភាព
交差点事故（Kōsaten-jiko） — គ្រោះថ្នាក់នៅផ្លូវប្រសព្វ
拘束時間（Kōsoku-jikan） — រយៈពេលជាប់កាតព្វកិច្ចការងារ
後方死角（Kōhō-shikaku） — ចំណុចងងឹតខាងក្រោយ
構えブレーキ（Kamae-burēki） — ការត្រៀមជើងលើហ្វ្រាំង
貨物自動車運送事業法（Kamotsu-jidōsha-unsō-jigyōhō） — ច្បាប់អាជីវកម្មដឹកជញ្ជូនទំនិញ
車間距離（Shakan-kyori） — គម្លាតសុវត្ថិភាពរវាងឡាន
死角（Shikaku） — ចំណុចងងឹតមើលមិនឃើញ (Blind Spot)
軸重（Jikujū） — ទម្ងន់ផ្ទុកលើអ័ក្សកង់
下車確認（Gesha-kakunin） — ការចុះពិនិត្យជុំវិញឡាន
ジャストインタイム（Jasuto-in-taimu） — ប្រព័ន្ធផលិតទាន់ពេលវេលា
ジャックナイフ現象（Jakku-naifu-genshō） — ឡានកន្ទុយសណ្តោងបត់ដូចកាំបិត
準中型免許（Jun-chūgata-menkyo） — ប័ណ្ណបើកបរធុនមធ្យមស្រាល
乗務前点呼（Jōmu-mae-tenko） — ការហៅឈ្មោះពិនិត្យមុនបើកបរ
乗務後点呼（Jōmu-go-tenko） — ការហៅឈ្មោះពិនិត្យក្រោយបើកបរ
徐行（Jokō） — ការបើកបរយឺតៗ (អាចឈប់ភ្លាម)
蒸発現象（Jōhatsu-genshō） — ភ្នែកមើលមិនឃើញថ្មើរជើងដោយចំណាំងពន្លឺ
白ナンバー（Shiro-nanbā） — ផ្លាកលេខស (ប្រើប្រាស់ផ្ទាល់ខ្លួន)
睡眠時無呼吸症候群（Suiminji-mukokyū-shōkōgun） — ជម្ងឺឈប់ដកដង្ហើមពេលដេក (SAS)
スローイン・ファストアウト（Surōin-fasutoauto） — «ចូលយឺត ចេញលឿន» ពេលបត់
制動距離（Seidō-kyori） — ចម្ងាយចាប់ជាន់ហ្វ្រាំងដល់ឡានឈប់
整備管理者（Seibi-kanrija） — អ្នកគ្រប់គ្រងថែទាំបច្ចេកទេស
対面点呼（Taimen-tenko） — ការហៅឈ្មោះជួបមុខផ្ទាល់
タイダウンベルト（Taidaun-beruto） — ខ្សែក្រវាត់រឹតចងទំនិញ
タイヤバースト（Taiya-bāsuto） — ការផ្ទុះកង់ឡាន
墜落・転落防止（Tsuiraku-tenraku-bōshi） — ការការពារការធ្លាក់ពីទីខ្ពស់
デジタル式運行記録計（Dejitaru-unkō-kirokukei） — ម៉ាស៊ីនកត់ត្រាធ្វើដំណើរឌីជីថល (ដេជីតាកូ)
テールゲートリフター（Tērugēto-rihutā） — កម្រាលលើកទំនិញខាងក្រោយ (Power Gate)
ドア・ツー・ドア輸送（Doa-tsū-doa-yusō） — ការដឹកជញ្ជូនពីទ្វារទៅទ្វារ
道路交通法（Dōro-kōtsūhō） — ច្បាប់ចរាចរណ៍ផ្លូវគោក
内輪差（Nairinsa） — កាំគម្លាតកង់មុខ-កង់ក្រោយពេលបត់
ながら運転（Nagara-unten） — ការបើកបរបណ្តើរធ្វើអ្វីផ្សេង (និយាយទូរស័ព្ទ)
荷崩れ（Nikazure） — ការរលំ ឬធ្លាក់ទំនិញក្នុងឡាន
日常点検（Nichijō-tenken） — ការត្រួតពិនិត្យរថយន្តប្រចាំថ្ងៃ
二日酔い（Futsuka-yoi） — អាការៈស្រវឹងសេសសល់ពីថ្ងៃមុន
脳血管疾患（Nōkekkan-shikkan） — ជម្ងឺសរសៃឈាមខួរក្បាល
ハイドロプレーニング現象（Haidoro-purēningu） — ឡានរអិលលើទឹកបាត់កម្លាំងកកិត
歯止め（Hadome） — កំណល់កង់ឡាន (ទប់ពេលចត)
漫然運転（Manzen-unten） — ការបើកបរអណ្តែតអណ្តូង ខ្វះការយកចិត្តទុកដាក់
フェード現象（Fēdo-genshō） — ហ្វ្រាំងមិនស៊ីដោយកម្ដៅឡើងខ្ពស់
ふんわりアクセル（Hunwari-akuseru） — ការជាន់ហ្គែរថ្នមៗពេលចេញដំណើរ
ブラックアイスバーン（Burakku-aisubān） — ផ្លូវកកស្រទាប់ស្តើងមើលដូចផ្លូវធម្មតា
偏荷重（Henkajū） — ការផ្ទុកទំនិញលំអៀងម្ខាង
防衛運転（Bōei-unten） — ការបើកបរការពារខ្លួន ប្រុងប្រយ័ត្នខ្ពស់
歩行者優先（Hokōsha-yūsen） — ការផ្តល់អាទិភាពដល់អ្នកថ្មើរជើង
巻き込み事故（Makikomi-jiko） — គ្រោះថ្នាក់កិនកៀរពេលឡានបត់
緑ナンバー（Midori-nanbā） — ផ្លាកលេខបៃតង (អាជីវកម្មដឹកជញ្ជូន)
無免許運転（Mumenkyo-unten） — ការបើកបរគ្មានប័ណ្ណបើកបរ
ライフライン（Raifurain） — ខ្សែជីវិត សេវាចាំបាច់ក្នុងសង្គម
ラッシングバー（Rasshingubā） — របារដែកទប់ឃាត់ទំនិញ
労働災害（Rōdō-saigai） — គ្រោះថ្នាក់ការងារ
輪止め（Wadome） — កំណល់កង់ឡាន
脇見運転（Wakimi-unten） — ការបើកបរងាកមើលឆ្វេងស្តាំ`,
  },
];
const SST_VIDEOS = [];
const SST_EXERCISES = [];

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
    sstTexts:           SST_TEXTS,
    sstVideos:          SST_VIDEOS,
    sstExercises:       SST_EXERCISES,
  };
}

// Immutable snapshot of the shipped seed library, kept so a saved/cloud copy
// (which fully replaces __lessonsLib on load) can be reconciled with newly
// shipped lessons instead of hiding them.
if (!window.__lessonsSeed) {
  window.__lessonsSeed = {
    theoryTexts:        [...THEORY_TEXTS],
    theoryVideos:       [...THEORY_VIDEOS],
    theoryExercises:    [...THEORY_EXERCISES],
    practicalTexts:     [...PRACTICAL_TEXTS],
    practicalVideos:    [...PRACTICAL_VIDEOS],
    practicalExercises: [...PRACTICAL_EXERCISES],
    sstTexts:           [...SST_TEXTS],
    sstVideos:          [...SST_VIDEOS],
    sstExercises:       [...SST_EXERCISES],
  };
}

// Additive migration: after a saved/cloud library is loaded it may predate newly
// shipped lessons (e.g. the Stage 3 / AI course) or lack fields added later
// (e.g. goal_km/goal_en). Merge the seed in WITHOUT discarding user edits:
//   • a seed lesson whose id is absent  → appended
//   • a seed lesson already present      → fills any missing content field
// Idempotent; safe to run after every load.
// NOT filled: guideStudent — that is instructor-toggled state, never overwritten.
const SEED_FILL_FIELDS = ['goal_km','goal_en','teach_km','teach_en',
  'points_km','points_en','cautions_km','cautions_en','guideLoc'];
window.__mergeSeedLessons = function () {
  const lib = window.__lessonsLib, seed = window.__lessonsSeed;
  if (!lib || !seed) return;
  Object.keys(seed).forEach(key => {
    const arr = lib[key], seedArr = seed[key];
    if (!Array.isArray(arr) || !Array.isArray(seedArr)) return;
    const byId = new Map(arr.map(x => [x && x.id, x]));
    seedArr.forEach(item => {
      if (!item || !item.id) return;
      const existing = byId.get(item.id);
      if (!existing) { arr.push(item); return; }
      SEED_FILL_FIELDS.forEach(k => { if (item[k] != null && existing[k] == null) existing[k] = item[k]; });
    });
  });
};
