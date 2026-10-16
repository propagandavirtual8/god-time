export const sourceRoot='https://www.hebrew4christians.com';
const monthPath='/Holidays/Rosh_Chodesh/';
export const mainSource=sourceRoot+monthPath+'rosh_chodesh.html';
export const tribeSource='https://hebrewnations.com/articles/tribes/calendar.html';
// Original Indonesian summaries. Each month links to its own source, not a translation mirror.
export const months=[
 {key:'nisan',name:'Nisan',hebrew:'נִיסָן',tribe:'Yehuda',icon:'lion',symbol:'Singa',number:1,season:'Musim semi',approx:'Maret–April',title:'Mengingat karya penebusan',verse:'Keluaran 12:1–14',
  summary:'Nisan membuka urutan bulan untuk perayaan dalam Taurat. Kisah keluarnya Israel dari Mesir menjadi pusat pembelajaran bulan ini. Pesakh dan Roti Tidak Beragi mengajak umat mengingat pembebasan serta hidup yang dikuduskan bagi Tuhan.',
  events:[['14–21 Nisan','Pesakh dan Roti Tidak Beragi','Keluaran 12; Imamat 23:5–8','Alkitab'],['1 Nisan','Kemah Suci didirikan','Keluaran 40:17','Alkitab']],
  reflection:'Karya Tuhan yang mana masih perlu kamu ingat dengan syukur? Pilih satu kebiasaan yang perlu ditinggalkan agar hidupmu semakin taat.',prayer:'Tuhan, ajar kami mengingat penebusan-Mu dan melangkah dalam ketaatan yang lahir dari kasih.',url:sourceRoot+'/Holidays/Spring_Holidays/Rosh_Chodashim/rosh_chodashim.html'},
 {key:'iyar',name:'Iyar',hebrew:'אִיָּר',tribe:'Isakhar',icon:'sun',symbol:'Matahari · ikon pembelajaran',number:2,season:'Musim semi',approx:'April–Mei',title:'Belajar percaya dalam perjalanan',verse:'Keluaran 16:1–5',
  summary:'Iyar berada di antara Pesakh dan Shavuot. Perjalanan Israel di padang gurun memperlihatkan pemeliharaan Tuhan melalui manna. Bulan kedua juga disebut Ziw; pembangunan Bait Suci Salomo dimulai pada bulan ini.',
  events:[['14 Iyar','Pesakh Sheni','Bilangan 9:9–12','Alkitab'],['Bulan kedua','Pembangunan Bait Suci dimulai','1 Raja-raja 6:1','Alkitab'],['18 Iyar','Lag BaOmer','Hari ke-33 penghitungan Omer','Tradisi']],
  reflection:'Di tengah proses yang belum selesai, apa yang dapat kamu percayakan kepada Tuhan hari ini?',prayer:'Bapa, bentuklah kesetiaan kami melalui tanggung jawab sehari-hari dan cukupkan kebutuhan kami.',url:sourceRoot+monthPath+'Iyyar/iyyar.html'},
 {key:'sivan',name:'Sivan',hebrew:'סִיוָן',tribe:'Zebulon',icon:'ship',symbol:'Kapal',number:3,season:'Musim semi',approx:'Mei–Juni',title:'Mendengar dan melakukan firman',verse:'Keluaran 19:1–8; Kisah Para Rasul 2:1–4',
  summary:'Pada bulan ketiga, Israel tiba di padang gurun Sinai. Tradisi Yahudi menghubungkan Shavuot dengan pemberian Taurat. Bagi pembelajaran Kristen, Pentakosta juga mengingatkan pencurahan Roh Kudus yang dicatat dalam Kisah Para Rasul.',
  events:[['Bulan ketiga','Israel tiba di Sinai','Keluaran 19:1','Alkitab'],['6 Sivan','Shavuot','Imamat 23:15–21; tanggal menurut kalender Yahudi tetap','Alkitab & tradisi']],
  reflection:'Firman yang sudah kamu pahami mana yang perlu mulai kamu lakukan secara nyata?',prayer:'Roh Kudus, bukakan pengertian kami dan mampukan kami menjalankan firman dalam kasih.',url:sourceRoot+monthPath+'Sivan/sivan.html'},
 {key:'tamuz',name:'Tamuz',hebrew:'תַּמּוּז',tribe:'Ruben',icon:'water',symbol:'Air',number:4,season:'Musim panas',approx:'Juni–Juli',title:'Menjaga hati tetap setia',verse:'Keluaran 32:1–20; Zakharia 8:19',
  summary:'Tamuz dikenal dalam tradisi Yahudi sebagai awal masa perkabungan tiga minggu. Tanggal 17 dikaitkan dengan pecahnya loh batu dan berbagai peristiwa duka. Kisah anak lembu emas menjadi bahan pemeriksaan hati terhadap penyembahan berhala.',
  events:[['17 Tamuz','Puasa bulan keempat','Zakharia 8:19; penetapan tanggal dalam tradisi','Tradisi'],['17 Tamuz–9 Av','Tiga minggu perkabungan','Mengenang kehancuran Yerusalem','Tradisi']],
  reflection:'Apakah ada hal yang mulai mengambil tempat Tuhan dalam keputusanmu?',prayer:'Tuhan, selidiki hati kami dan pulihkan kesetiaan kami kepada-Mu.',url:sourceRoot+monthPath+'Tammuz/tammuz.html'},
 {key:'av',name:'Av',hebrew:'אָב',tribe:'Simeon',icon:'gate',symbol:'Gerbang · ikon pembelajaran',number:5,season:'Musim panas',approx:'Juli–Agustus',title:'Menemukan penghiburan dalam dukacita',verse:'Bilangan 33:38; Yesaya 40:1–2',
  summary:'Alkitab mencatat wafatnya Harun pada hari pertama bulan kelima. Dalam tradisi Yahudi, 9 Av memperingati kehancuran kedua Bait Suci. Setelah masa perkabungan, pembacaan penghiburan mengingatkan umat akan pengharapan kepada Tuhan.',
  events:[['1 Av','Harun wafat di Gunung Hor','Bilangan 33:38','Alkitab'],['9 Av','Tisha BeAv','Peringatan kehancuran Bait Suci; tanggal tradisional','Tradisi']],
  reflection:'Siapa yang sedang berduka dan dapat kamu dampingi dengan kehadiran serta pertolongan nyata?',prayer:'Bapa penghiburan, kuatkan yang berduka dan pakailah kami untuk membawa pengharapan.',url:sourceRoot+monthPath+'Av/av.html'},
 {key:'elul',name:'Elul',hebrew:'אֱלוּל',tribe:'Gad',icon:'tent',symbol:'Kemah · ikon pembelajaran',number:6,season:'Akhir musim panas',approx:'Agustus–September',title:'Kembali kepada Tuhan dengan sepenuh hati',verse:'Yesaya 55:6–7; Nehemia 6:15',
  summary:'Elul merupakan masa persiapan menjelang Rosh Hashanah dan Yom Kippur dalam tradisi Yahudi. Teshuvah berarti berbalik atau kembali. Doa pengampunan dan pemeriksaan diri menolong umat merenungkan hubungan dengan Tuhan dan sesama.',
  events:[['25 Elul','Tembok Yerusalem selesai dibangun','Nehemia 6:15','Alkitab'],['Sepanjang bulan','Persiapan dan doa pengampunan','Kebiasaan teshuvah dan selichot','Tradisi']],
  reflection:'Adakah kesalahan yang perlu kamu akui atau hubungan yang perlu kamu pulihkan?',prayer:'Tuhan, berikan hati yang mau bertobat dan keberanian untuk memperbaiki kesalahan.',url:sourceRoot+'/Holidays/Fall_Holidays/Elul/elul.html'},
 {key:'tisyri',name:'Tisyri',hebrew:'תִּשְׁרֵי',tribe:'Efraim',icon:'grain',symbol:'Bulir gandum · ikon pembelajaran',number:7,season:'Musim gugur',approx:'September–Oktober',title:'Merendahkan diri dan bersukacita di hadapan Tuhan',verse:'Imamat 23:23–43',
  summary:'Tisyri adalah bulan ketujuh dalam urutan Taurat, sekaligus awal tahun sipil Yahudi. Rosh Hashanah, Yom Kippur, dan Sukkot membentuk rangkaian peringatan tentang pertobatan, pendamaian, serta pemeliharaan Tuhan.',
  events:[['1–2 Tisyri','Rosh Hashanah; Yom Teruah pada tanggal 1','Imamat 23:23–25; peringatan dua hari dalam tradisi','Alkitab & tradisi'],['10 Tisyri','Yom Kippur','Imamat 23:26–32','Alkitab'],['15–21 Tisyri','Sukkot','Imamat 23:33–43','Alkitab'],['22 Tisyri','Shemini Atzeret','Imamat 23:36','Alkitab']],
  reflection:'Bagaimana kamu dapat menghidupi rasa syukur sekaligus kerendahan hati dalam minggu ini?',prayer:'Tuhan, ajar kami bersyukur atas pemeliharaan-Mu dan datang kepada-Mu dengan hati yang jujur.',url:sourceRoot+'/Holidays/Fall_Holidays/Rosh_Hashannah/rosh_hashannah.html'},
 {key:'cheshvan',name:'Cheshvan',hebrew:'חֶשְׁוָן',tribe:'Manasye',icon:'branch',symbol:'Ranting · ikon pembelajaran',number:8,season:'Musim gugur',approx:'Oktober–November',title:'Setia dalam musim yang tersembunyi',verse:'1 Raja-raja 6:38',
  summary:'Cheshvan mengikuti rangkaian hari raya Tisyri dan tidak memiliki hari raya besar dalam kalender Yahudi. Tradisi mengaitkannya dengan kisah air bah Nuh. Bulan kedelapan disebut Bul dalam catatan selesainya pembangunan Bait Suci Salomo.',
  events:[['Bulan kedelapan · Bul','Pembangunan Bait Suci selesai','1 Raja-raja 6:38','Alkitab'],['17 dan 27 Cheshvan','Air bah dimulai dan bumi kering','Kejadian 7:11; 8:14. Pengaitan bulan dengan Cheshvan mengikuti tradisi; teks menyebut bulan kedua.','Penanggalan tradisi']],
  reflection:'Kesetiaan sering tumbuh dalam pekerjaan yang belum dilihat orang. Tanggung jawab kecil apa yang dapat kamu kerjakan dengan sungguh-sungguh hari ini?',prayer:'Tuhan, teguhkan kami untuk setia saat tidak ada sorotan. Ajarlah kami menghargai proses dan melayani dengan hati yang utuh.',url:sourceRoot+monthPath+'Cheshvan/cheshvan.html'},
 {key:'kislev',name:'Kislev',hebrew:'כִּסְלֵו',tribe:'Benyamin',icon:'wolf',symbol:'Serigala',number:9,season:'Menjelang musim dingin',approx:'November–Desember',title:'Memelihara pengharapan dan terang',verse:'Yohanes 10:22–30; Nehemia 1:1–4',
  summary:'Kislev memuat awal Hanukkah, peringatan penahbisan kembali Bait Suci. Kitab Yohanes menyebut Hari Raya Penahbisan pada musim dingin. Sumber pembelajaran juga menghubungkan bulan ini dengan kisah-kisah mimpi dalam pembacaan Taurat.',
  events:[['25 Kislev–awal Tevet','Hanukkah · delapan hari','Yohanes 10:22; latar sejarah Yahudi','Sejarah & tradisi'],['Bulan Kislev','Nehemia menerima kabar tentang Yerusalem','Nehemia 1:1–4','Alkitab']],
  reflection:'Di tengah keadaan yang terasa gelap, bagaimana kamu bisa menghadirkan kebaikan yang sederhana?',prayer:'Yesus, tuntun kami hidup sebagai pembawa terang melalui perkataan dan tindakan yang penuh kasih.',url:sourceRoot+monthPath+'Kislev/kislev.html'},
 {key:'tevet',name:'Tevet',hebrew:'טֵבֵת',tribe:'Dan',icon:'scales',symbol:'Timbangan · ikon pembelajaran',number:10,season:'Musim dingin',approx:'Desember–Januari',title:'Membuka hati untuk dikoreksi',verse:'2 Raja-raja 25:1; Yehezkiel 24:1–2',
  summary:'Tevet mengingatkan awal pengepungan Yerusalem oleh Babel. Puasa tanggal 10 berkembang sebagai peringatan peristiwa itu. Nama Tevet juga muncul dalam kisah Ester ketika ia dibawa menghadap raja.',
  events:[['10 Tevet','Pengepungan Yerusalem dimulai','2 Raja-raja 25:1; Yehezkiel 24:1–2','Alkitab'],['Bulan Tevet','Ester dibawa menghadap raja','Ester 2:16','Alkitab']],
  reflection:'Nasihat baik apa yang selama ini kamu tunda untuk dengarkan?',prayer:'Tuhan, lembutkan hati kami untuk menerima teguran dan bertindak dengan bijaksana.',url:sourceRoot+monthPath+'Tevet/tevet.html'},
 {key:'shevat',name:'Shevat',hebrew:'שְׁבָט',tribe:'Asyer',icon:'tree',symbol:'Pohon zaitun',number:11,season:'Musim dingin',approx:'Januari–Februari',title:'Berakar dalam firman, bertumbuh dalam hidup',verse:'Ulangan 1:1–5; Zakharia 1:7',
  summary:'Pada awal bulan kesebelas, Musa mulai menjelaskan Taurat kepada Israel. Tu BiShevat, tahun baru pepohonan dalam tradisi Yahudi, memberi kesempatan belajar tentang pemeliharaan ciptaan dan kehidupan yang berbuah.',
  events:[['1 Shevat','Musa mulai menjelaskan Taurat','Ulangan 1:3–5','Alkitab'],['15 Shevat','Tu BiShevat','Tahun baru pepohonan dalam tradisi Yahudi','Tradisi'],['24 Shevat','Firman Tuhan kepada Zakharia','Zakharia 1:7','Alkitab']],
  reflection:'Langkah kecil apa yang akan menolongmu berakar lebih dalam pada firman Tuhan?',prayer:'Bapa, tumbuhkan ketekunan kami dalam firman dan hasilkan buah kasih melalui hidup kami.',url:sourceRoot+monthPath+'Shevat/shevat.html'},
 {key:'adar',name:'Adar',hebrew:'אֲדָר',tribe:'Naftali',icon:'deer',symbol:'Rusa',number:12,season:'Menjelang musim semi',approx:'Februari–Maret',title:'Bersukacita dan berbagi karena pertolongan Tuhan',verse:'Ester 9:20–22',
  summary:'Purim mengenang pembebasan orang Yahudi dalam kisah Ester. Sukacita diwujudkan dengan saling memberi dan menolong orang miskin. Pada tahun kabisat terdapat Adar I dan Adar II; Purim utama berlangsung pada Adar II.',
  events:[['14 Adar / Adar II','Purim','Ester 9:20–22','Alkitab'],['15 Adar / Adar II','Shushan Purim','Ester 9:18–19; berlaku di kota bertembok tertentu','Alkitab & tradisi'],['14 Adar I','Purim Katan pada tahun kabisat','Peringatan kecil dalam tradisi Yahudi','Tradisi']],
  reflection:'Siapa yang bisa turut merasakan sukacitamu melalui pemberian yang nyata?',prayer:'Tuhan, jadikan syukur kami kemurahan hati dan keberanian untuk membela yang membutuhkan.',url:sourceRoot+monthPath+'Adar/adar.html'}
];
export const lessons=[
 ['Apa itu Rosh Chodesh?','Awal bulan Yahudi, yang menolong menentukan urutan perayaan. Bulan berlangsung 29 atau 30 hari.','Bilangan 28:11–15'],
 ['Bulan dan pembaruan','Siklus bulan menjadi gambaran pembaruan dalam pengajaran sumber. Tuhan adalah pusat penyembahan.','Mazmur 104:19'],
 ['Awal bulan dalam Taurat','Keluaran menempatkan bulan keluarnya Israel dari Mesir sebagai awal urutan bulan.','Keluaran 12:1–2'],
 ['Dari pengamatan ke perhitungan','Dahulu awal bulan diumumkan berdasarkan kesaksian; kalender tetap kini memakai perhitungan.','Latar sejarah kalender'],
 ['Sabat dan pembacaan','Tradisi mengenal Sabat pemberkatan bulan, Machar Chodesh, serta bacaan khusus ketika awal bulan jatuh pada Sabat.','1 Samuel 20:18–42; Yesaya 66'],
 ['Doa dan kebiasaan','Birkat HaChodesh memohon berkat bulan baru. Kiddush Levanah merupakan kebiasaan berkat saat melihat bulan.','Tradisi Yahudi'],
 ['Pengharapan yang akan datang','Sumber mengaitkan pembaruan bulanan dengan penyembahan dan pohon kehidupan. Ini merupakan pembacaan teologis penulis.','Yesaya 66:23; Wahyu 22:1–2'],
 ['Belajar sebagai orang Kristen','Sumber mengajak belajar dengan sukacita tanpa menjadikan peringatan sebagai kewajiban keselamatan atau alasan menghakimi sesama.','Kolose 2:16–17; Roma 14:5–6']
];
export const globalPrayers=[
 ['Perdamaian dan perlindungan','Berdoa bagi keselamatan warga sipil di Israel, Palestina, dan semua wilayah konflik; bagi keluarga yang kehilangan, serta para pembawa damai.','Matius 5:9'],
 ['Gereja dan pelayanan','Berdoa agar gereja melayani dengan rendah hati, setia mengajarkan firman, dan hadir bagi mereka yang terpinggirkan.','Efesus 4:1–6'],
 ['Bangsa dan generasi mendatang','Berdoa bagi pemimpin yang adil, keluarga yang saling mengasihi, dan anak muda yang bertumbuh dalam hikmat.','1 Timotius 2:1–2']
];
  
