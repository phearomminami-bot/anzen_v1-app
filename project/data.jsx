// data.jsx — fake content (bilingual KH/EN)

const STUDENTS = [
  {id:"S-1042", name:"សុខ ចាន់ថា", en:"Sok Chantha",      cls:"B (Sedan)", inst:"Mr. Vichea", hours:14, target:30, status:"In progress", next:"មិថុនា 4, 09:00", phone:"+855 12 345 678", paid:0.6, photo:"port-1"},
  {id:"S-1043", name:"ឡុង សុភារី",  en:"Long Sophary",    cls:"B (Sedan)", inst:"Ms. Dany",   hours:22, target:30, status:"Road exam soon", next:"មិថុនា 5, 14:00", phone:"+855 17 882 401", paid:1.0, photo:"port-2"},
  {id:"S-1044", name:"គង់ ពិសិដ្ឋ", en:"Kong Piseth",     cls:"A (Moto)",  inst:"Mr. Bora",   hours:6,  target:18, status:"New",        next:"មិថុនា 6, 07:30", phone:"+855 96 117 220", paid:0.3, photo:"port-3"},
  {id:"S-1045", name:"ហ៊ុន ដារ៉ូ",   en:"Hun Daro",        cls:"C (Truck)", inst:"Mr. Vichea", hours:9,  target:40, status:"In progress", next:"មិថុនា 4, 16:00", phone:"+855 11 553 088", paid:0.5, photo:"port-4"},
  {id:"S-1046", name:"ឈឹម ឡាយហ៊ាង",  en:"Chhim Layheang",  cls:"B (Sedan)", inst:"Ms. Dany",   hours:28, target:30, status:"Cleared", next:"—",          phone:"+855 78 020 111", paid:1.0, photo:"port-5"},
  {id:"S-1047", name:"ឈិន សុវណ្ណា", en:"Chhin Sovannah",  cls:"B (Sedan)", inst:"Ms. Channa", hours:11, target:30, status:"In progress", next:"មិថុនា 7, 11:00", phone:"+855 81 779 003", paid:0.5, photo:"port-6"},
  {id:"S-1048", name:"ប៉ែន ដារ៉ា",  en:"Pen Dara",         cls:"A (Moto)",  inst:"Mr. Bora",   hours:18, target:18, status:"Road exam soon", next:"មិថុនា 5, 10:30", phone:"+855 92 441 008", paid:1.0, photo:"port-7"},
  {id:"S-1049", name:"យឹម សុខគន្ធា", en:"Yim Sokuntha",    cls:"B (Sedan)", inst:"Ms. Channa", hours:4,  target:30, status:"New",        next:"មិថុនា 8, 08:00", phone:"+855 70 220 552", paid:0.2, photo:"port-8"},
  {id:"S-1050", name:"ស៊ាន ប៉ូលីន",  en:"Sean Polin",      cls:"B (Sedan)", inst:"Mr. Vichea", hours:25, target:30, status:"In progress", next:"មិថុនា 4, 13:00", phone:"+855 17 661 991", paid:0.8, photo:"port-9"},
  {id:"S-1051", name:"ឆន សុធារ៉ា",   en:"Chan Sothera",    cls:"C (Truck)", inst:"Mr. Bora",   hours:30, target:40, status:"In progress", next:"មិថុនា 9, 15:00", phone:"+855 12 091 477", paid:0.75, photo:"port-10"},
];

const INSTRUCTORS = [
  {id:"I-01", name:"ស៊ុំ វិច្ឆេយ្យ", en:"Sum Vichea",   role:"Senior · ជាន់ខ្ពស់", cls:["B","C"], rating:4.9, students:18, today:5, since:"2019", lang:"ខ្មែរ · EN", photo:"inst-1"},
  {id:"I-02", name:"លី ដានី",      en:"Ly Dany",       role:"Lead · មេបង្រៀន",  cls:["B"],   rating:4.8, students:22, today:6, since:"2017", lang:"ខ្មែរ · 中文", photo:"inst-2"},
  {id:"I-03", name:"ខ្លុត បូរ៉ា",    en:"Khlot Bora",     role:"Moto · ម៉ូតូ",      cls:["A"],   rating:4.7, students:14, today:4, since:"2021", lang:"ខ្មែរ", photo:"inst-3"},
  {id:"I-04", name:"ផល ចាន់ណា",   en:"Phal Channa",   role:"Senior · ជាន់ខ្ពស់", cls:["B"],   rating:4.9, students:16, today:5, since:"2018", lang:"ខ្មែរ · EN", photo:"inst-4"},
  {id:"I-05", name:"ចេង សុក្កណ្ឌ", en:"Cheng Sokkann", role:"Apprentice · ហាត់ការ", cls:["B"],   rating:4.5, students:7,  today:3, since:"2024", lang:"ខ្មែរ", photo:"inst-5"},
];

const VEHICLES = [
  {id:"V-01", plate:"2AB-4180", make:"Toyota Vios · 2022", cls:"B (Sedan)",   km:38240, status:"Active",       service:"In 1,200 km", inst:"Mr. Vichea", photo:"car-1"},
  {id:"V-02", plate:"2AC-9021", make:"Hyundai Accent · 2023", cls:"B (Sedan)", km:21105, status:"Active",       service:"In 4,000 km", inst:"Ms. Dany",   photo:"car-2"},
  {id:"V-03", plate:"2AC-1144", make:"Honda Wave · 2024",   cls:"A (Moto)",    km:5680,  status:"Active",       service:"OK",          inst:"Mr. Bora",   photo:"car-3"},
  {id:"V-04", plate:"2AB-0028", make:"Isuzu D-Max · 2021",  cls:"C (Truck)",   km:91300, status:"Service due",  service:"Today",       inst:"—",          photo:"car-4"},
  {id:"V-05", plate:"2AC-7715", make:"Kia Picanto · 2022",  cls:"B (Sedan)",   km:44102, status:"Active",       service:"In 800 km",   inst:"Ms. Channa", photo:"car-5"},
  {id:"V-06", plate:"2AC-2206", make:"Yamaha NMAX · 2023",  cls:"A (Moto)",    km:9402,  status:"Workshop",     service:"Brake pads",  inst:"—",          photo:"car-6"},
];

const LESSONS = [
  // hour 7..18 ; day 0..6 (Mon..Sun)
  {day:0, h:7,  len:1.5, who:"S-1048", inst:"I-03", veh:"V-03", type:"Practical · Yard",   color:"a"},
  {day:0, h:9,  len:2,   who:"S-1042", inst:"I-01", veh:"V-01", type:"Practical · City",   color:"b"},
  {day:0, h:14, len:1,   who:"—",      inst:"I-02", veh:"—",    type:"Theory · Signs",     color:"c"},
  {day:1, h:8,  len:2,   who:"S-1043", inst:"I-02", veh:"V-02", type:"Mock road exam",     color:"d"},
  {day:1, h:10, len:1.5, who:"S-1044", inst:"I-01", veh:"V-04", type:"Practical · Truck",  color:"a"},
  {day:1, h:13, len:1,   who:"S-1050", inst:"I-01", veh:"V-01", type:"Practical · Night",  color:"b"},
  {day:1, h:16, len:1.5, who:"S-1045", inst:"I-02", veh:"V-05", type:"Practical · Highway",color:"d"},
  {day:2, h:7,  len:1,   who:"—",      inst:"I-04", veh:"—",    type:"Theory · First aid", color:"c"},
  {day:2, h:9,  len:2,   who:"S-1047", inst:"I-03", veh:"V-06", type:"Practical · Moto",   color:"a"},
  {day:2, h:13, len:1.5, who:"S-1046", inst:"I-02", veh:"V-02", type:"Road exam (real)",   color:"e"},
  {day:2, h:15, len:1.5, who:"S-1051", inst:"I-03", veh:"V-04", type:"Practical · Truck",  color:"a"},
  {day:3, h:8,  len:1,   who:"S-1049", inst:"I-04", veh:"V-05", type:"Practical · Yard",   color:"a"},
  {day:3, h:10, len:1.5, who:"S-1042", inst:"I-01", veh:"V-01", type:"Practical · City",   color:"b"},
  {day:3, h:14, len:2,   who:"—",      inst:"I-02", veh:"—",    type:"Group theory",       color:"c"},
  {day:4, h:7,  len:1.5, who:"S-1048", inst:"I-03", veh:"V-03", type:"Practical · Moto",   color:"a"},
  {day:4, h:9,  len:2,   who:"S-1050", inst:"I-01", veh:"V-01", type:"Mock road exam",     color:"d"},
  {day:4, h:13, len:1.5, who:"S-1043", inst:"I-02", veh:"V-02", type:"Road exam (real)",   color:"e"},
  {day:4, h:16, len:1,   who:"S-1044", inst:"I-01", veh:"V-04", type:"Practical · Truck",  color:"a"},
  {day:5, h:8,  len:2,   who:"S-1051", inst:"I-03", veh:"V-04", type:"Practical · Highway",color:"d"},
  {day:5, h:11, len:1,   who:"S-1047", inst:"I-03", veh:"V-06", type:"Practical · Moto",   color:"a"},
  {day:6, h:9,  len:2,   who:"—",      inst:"I-04", veh:"—",    type:"Open garage day",    color:"c"},
];

const INVOICES = [
  {id:"INV-2026-0418", student:"S-1042", date:"មិថុនា 1", amount:180, status:"Paid",     method:"ABA"},
  {id:"INV-2026-0419", student:"S-1044", date:"មិថុនា 1", amount:120, status:"Paid",     method:"Cash"},
  {id:"INV-2026-0420", student:"S-1049", date:"មិថុនា 2", amount:60,  status:"Overdue",  method:"—"},
  {id:"INV-2026-0421", student:"S-1051", date:"មិថុនា 2", amount:240, status:"Paid",     method:"ABA"},
  {id:"INV-2026-0422", student:"S-1047", date:"មិថុនា 3", amount:90,  status:"Pending",  method:"—"},
  {id:"INV-2026-0423", student:"S-1050", date:"មិថុនា 3", amount:160, status:"Paid",     method:"Wing"},
  {id:"INV-2026-0424", student:"S-1045", date:"មិថុនា 3", amount:200, status:"Refunded", method:"ABA"},
];

const DAYS_KM = ["ច័ន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍","អាទិត្យ"];
const DAYS_EN = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

Object.assign(window, { STUDENTS, INSTRUCTORS, VEHICLES, LESSONS, INVOICES, DAYS_KM, DAYS_EN });
