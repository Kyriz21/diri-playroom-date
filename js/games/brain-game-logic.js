const LOVE_AXES = ['I/E', 'S/N', 'T/F', 'J/P'];

// A/B stays directionally consistent inside each dimension:
// I, S, T, J are always option A; E, N, F, P are always option B.
export const LOVE_QUESTIONS = [
  // Introversion / Extraversion — original bank
  { id:'ie01', axis:'I/E', prompt:'Setelah minggu yang melelahkan, cara terbaik mengisi ulang energi adalah…', a:'Menikmati waktu tenang sendiri', b:'Bertemu atau menelepon orang terdekat' },
  { id:'ie02', axis:'I/E', prompt:'Saat datang ke acara dengan banyak orang yang belum dikenal, kamu biasanya…', a:'Mengamati dulu sebelum bergabung', b:'Mudah memulai obrolan' },
  { id:'ie03', axis:'I/E', prompt:'Ide kencan yang paling membuatmu nyaman adalah…', a:'Makan malam tenang berdua', b:'Mencoba tempat ramai yang baru' },
  { id:'ie04', axis:'I/E', prompt:'Ketika punya kabar menyenangkan, kamu cenderung…', a:'Menceritakannya ke satu-dua orang dekat', b:'Langsung membagikannya ke banyak orang' },
  { id:'ie05', axis:'I/E', prompt:'Dalam perjalanan panjang, kamu lebih suka…', a:'Menikmati pemandangan dan obrolan seperlunya', b:'Mengobrol, bernyanyi, dan membuat suasana ramai' },
  // Introversion / Extraversion — additional bank
  { id:'ie06', axis:'I/E', prompt:'Setelah menghadiri acara sosial seharian, kamu biasanya…', a:'Ingin pulang dan menikmati waktu sendiri', b:'Masih ingin melanjutkan obrolan bersama teman' },
  { id:'ie07', axis:'I/E', prompt:'Saat memikirkan keputusan penting, kamu lebih nyaman…', a:'Merenungkannya dulu sebelum bercerita', b:'Membicarakannya sambil menyusun pikiran' },
  { id:'ie08', axis:'I/E', prompt:'Akhir pekan ideal bagimu adalah…', a:'Aktivitas santai dengan lingkaran kecil', b:'Banyak kegiatan dan bertemu orang' },
  { id:'ie09', axis:'I/E', prompt:'Di grup percakapan yang ramai, kamu cenderung…', a:'Membaca dan merespons saat ada yang penting', b:'Aktif menimpali percakapan' },
  { id:'ie10', axis:'I/E', prompt:'Ketika harus bekerja bersama, kamu lebih suka…', a:'Mendapat waktu fokus untuk mengerjakan bagianmu', b:'Bertukar ide secara langsung sepanjang proses' },
  { id:'ie11', axis:'I/E', prompt:'Jika punya satu hari bebas tanpa agenda, kamu memilih…', a:'Menikmati kegiatan pribadi yang menenangkan', b:'Mengajak orang lain melakukan sesuatu' },
  { id:'ie12', axis:'I/E', prompt:'Saat bertemu teman baru, kamu biasanya…', a:'Mengenal satu orang lebih dalam', b:'Berkenalan dengan beberapa orang sekaligus' },
  { id:'ie13', axis:'I/E', prompt:'Ketika sedang bahagia, ekspresimu cenderung…', a:'Terlihat lewat sikap kecil dan cerita pribadi', b:'Terlihat jelas dan ingin dirayakan bersama' },
  { id:'ie14', axis:'I/E', prompt:'Untuk merayakan hari spesial, kamu memilih…', a:'Momen intim dengan orang terdekat', b:'Perayaan bersama banyak teman' },
  { id:'ie15', axis:'I/E', prompt:'Dalam diskusi, kamu lebih nyaman…', a:'Mendengarkan lalu menyampaikan pendapat yang sudah dipikirkan', b:'Menyampaikan ide spontan sambil berdiskusi' },
  { id:'ie16', axis:'I/E', prompt:'Saat merasa stres, hal yang paling membantu adalah…', a:'Mendapat ruang untuk menenangkan diri', b:'Berbicara dan ditemani orang lain' },
  { id:'ie17', axis:'I/E', prompt:'Kamu lebih mudah merasa akrab ketika…', a:'Sering bertemu dalam suasana kecil dan tenang', b:'Banyak melakukan aktivitas bersama' },
  { id:'ie18', axis:'I/E', prompt:'Jika ada waktu kosong di tempat umum, kamu cenderung…', a:'Menikmati waktu sendiri tanpa banyak interaksi', b:'Mencari kesempatan untuk berbincang' },
  { id:'ie19', axis:'I/E', prompt:'Ketika mendapat ide, kamu biasanya…', a:'Mengembangkannya sendiri terlebih dahulu', b:'Langsung mengujinya lewat percakapan' },
  { id:'ie20', axis:'I/E', prompt:'Dalam liburan bersama, kamu paling menikmati…', a:'Beberapa momen tenang tanpa jadwal padat', b:'Agenda bersama yang penuh aktivitas' },

  // Sensing / Intuition — original bank
  { id:'sn01', axis:'S/N', prompt:'Saat merencanakan liburan, hal pertama yang kamu pikirkan adalah…', a:'Tempat, jadwal, dan kebutuhan praktis', b:'Pengalaman unik yang mungkin terjadi' },
  { id:'sn02', axis:'S/N', prompt:'Kamu lebih mudah tertarik pada cerita yang…', a:'Dekat dengan kehidupan nyata', b:'Penuh kemungkinan dan imajinasi' },
  { id:'sn03', axis:'S/N', prompt:'Saat mempelajari sesuatu yang baru, kamu lebih suka…', a:'Contoh nyata langkah demi langkah', b:'Memahami gambaran besarnya lebih dulu' },
  { id:'sn04', axis:'S/N', prompt:'Ketika mengingat kenangan, yang paling melekat biasanya…', a:'Detail tempat, kata, dan kejadian', b:'Suasana dan makna di baliknya' },
  { id:'sn05', axis:'S/N', prompt:'Obrolan yang paling kamu nikmati biasanya tentang…', a:'Hal konkret yang sedang terjadi', b:'Ide, teori, atau kemungkinan masa depan' },
  // Sensing / Intuition — additional bank
  { id:'sn06', axis:'S/N', prompt:'Saat menerima petunjuk, kamu lebih suka…', a:'Instruksi jelas dengan contoh yang spesifik', b:'Tujuan umum agar bebas mencari caranya' },
  { id:'sn07', axis:'S/N', prompt:'Ketika memilih hadiah, kamu lebih mempertimbangkan…', a:'Kegunaan dan hal yang benar-benar dibutuhkan', b:'Makna simbolis dan kejutan di baliknya' },
  { id:'sn08', axis:'S/N', prompt:'Dalam membayangkan masa depan, kamu cenderung…', a:'Memikirkan langkah realistis yang bisa dilakukan', b:'Membayangkan berbagai kemungkinan besar' },
  { id:'sn09', axis:'S/N', prompt:'Saat menonton film, kamu lebih memperhatikan…', a:'Detail cerita dan tindakan para tokoh', b:'Simbol, pesan tersembunyi, dan teori cerita' },
  { id:'sn10', axis:'S/N', prompt:'Jika ingin memperbaiki sesuatu, kamu biasanya…', a:'Memeriksa bagian yang nyata-nyata bermasalah', b:'Mencari pendekatan baru yang mungkin lebih baik' },
  { id:'sn11', axis:'S/N', prompt:'Kamu lebih mudah mengingat seseorang melalui…', a:'Ciri, kebiasaan, atau kejadian spesifik', b:'Kesan umum dan hubungan emosional' },
  { id:'sn12', axis:'S/N', prompt:'Saat membaca petunjuk arah, kamu lebih suka…', a:'Rute rinci dan patokan yang terlihat', b:'Gambaran arah lalu menjelajah sendiri' },
  { id:'sn13', axis:'S/N', prompt:'Dalam percakapan, kamu paling tertarik pada…', a:'Pengalaman yang benar-benar dialami', b:'Kemungkinan yang belum pernah dicoba' },
  { id:'sn14', axis:'S/N', prompt:'Ketika belajar memasak, kamu memilih…', a:'Mengikuti takaran dan langkah resep', b:'Memahami prinsipnya lalu bereksperimen' },
  { id:'sn15', axis:'S/N', prompt:'Saat menghadapi masalah, kamu pertama-tama mencari…', a:'Fakta dan bukti yang bisa diperiksa', b:'Pola besar dan hubungan yang mungkin tersembunyi' },
  { id:'sn16', axis:'S/N', prompt:'Deskripsi tempat yang paling menarik bagimu adalah…', a:'Fasilitas, lokasi, ukuran, dan kondisi nyata', b:'Nuansa, potensi, dan pengalaman yang ditawarkan' },
  { id:'sn17', axis:'S/N', prompt:'Kamu lebih percaya pada penjelasan yang…', a:'Disertai contoh dan data konkret', b:'Menghubungkan banyak gagasan menjadi satu gambaran' },
  { id:'sn18', axis:'S/N', prompt:'Ketika membuat rencana bersama, kamu cenderung…', a:'Menyusun kebutuhan satu per satu', b:'Menentukan tema atau arah besar terlebih dahulu' },
  { id:'sn19', axis:'S/N', prompt:'Jika mendengar sebuah lagu, kamu lebih cepat menangkap…', a:'Lirik, instrumen, dan perubahan nadanya', b:'Suasana dan cerita yang dibayangkan lagu itu' },
  { id:'sn20', axis:'S/N', prompt:'Dalam menyelesaikan tugas, kamu lebih suka…', a:'Metode yang sudah terbukti bekerja', b:'Mencoba pendekatan baru yang potensial' },

  // Thinking / Feeling — original bank
  { id:'tf01', axis:'T/F', prompt:'Saat pasangan menghadapi masalah, bantuan pertamamu adalah…', a:'Mencari solusi yang paling masuk akal', b:'Mendengarkan perasaannya terlebih dahulu' },
  { id:'tf02', axis:'T/F', prompt:'Dalam mengambil keputusan sulit, kamu lebih mengutamakan…', a:'Konsistensi dan alasan yang objektif', b:'Dampaknya terhadap orang-orang yang terlibat' },
  { id:'tf03', axis:'T/F', prompt:'Ketika memberi masukan, kamu cenderung…', a:'Terus terang agar masalah cepat selesai', b:'Memilih kata-kata agar tetap terasa hangat' },
  { id:'tf04', axis:'T/F', prompt:'Saat berbeda pendapat, hal yang paling penting bagimu adalah…', a:'Menemukan argumen yang paling kuat', b:'Memastikan semua orang merasa didengar' },
  { id:'tf05', axis:'T/F', prompt:'Pujian yang paling berarti bagimu adalah…', a:'“Kamu hebat dalam memecahkan masalah.”', b:'“Kamu membuat orang merasa dimengerti.”' },
  // Thinking / Feeling — additional bank
  { id:'tf06', axis:'T/F', prompt:'Jika rencana bersama gagal, kamu biasanya ingin…', a:'Menganalisis penyebab dan memperbaiki sistemnya', b:'Memastikan semua orang tidak merasa disalahkan' },
  { id:'tf07', axis:'T/F', prompt:'Saat memilih di antara dua pilihan, kamu lebih mengandalkan…', a:'Kriteria yang konsisten untuk semua pilihan', b:'Nilai pribadi dan dampaknya bagi orang terdekat' },
  { id:'tf08', axis:'T/F', prompt:'Ketika pasangan melakukan kesalahan, respons awalmu adalah…', a:'Membahas tindakan dan akibatnya secara jelas', b:'Memahami alasan dan perasaan di baliknya' },
  { id:'tf09', axis:'T/F', prompt:'Dalam sebuah tim, kamu lebih menghargai…', a:'Keputusan yang adil berdasarkan aturan yang sama', b:'Keputusan yang mempertimbangkan kebutuhan tiap orang' },
  { id:'tf10', axis:'T/F', prompt:'Saat memberi kritik, tujuan utamamu adalah…', a:'Membuat hasil kerja lebih efektif', b:'Membantu orang berkembang tanpa kehilangan rasa percaya diri' },
  { id:'tf11', axis:'T/F', prompt:'Jika teman meminta pendapat tentang pilihannya, kamu cenderung…', a:'Menguraikan kelebihan dan kekurangan secara langsung', b:'Mencari tahu apa yang paling penting baginya' },
  { id:'tf12', axis:'T/F', prompt:'Kamu merasa keputusan yang baik adalah keputusan yang…', a:'Logis, konsisten, dan dapat dipertanggungjawabkan', b:'Manusiawi dan selaras dengan nilai yang dijaga' },
  { id:'tf13', axis:'T/F', prompt:'Ketika suasana menjadi tegang, kamu cenderung…', a:'Mengurai masalah agar pembicaraan tetap rasional', b:'Menenangkan suasana dan memulihkan kedekatan' },
  { id:'tf14', axis:'T/F', prompt:'Dalam membagi tugas, kamu lebih memperhatikan…', a:'Kemampuan dan efisiensi setiap orang', b:'Kondisi serta beban yang sedang ditanggung tiap orang' },
  { id:'tf15', axis:'T/F', prompt:'Jika harus memilih kata untuk menggambarkan dirimu, kamu lebih memilih…', a:'Adil dan objektif', b:'Peduli dan penuh empati' },
  { id:'tf16', axis:'T/F', prompt:'Ketika pasangan bercerita, kamu biasanya…', a:'Menyusun pertanyaan untuk memahami inti masalah', b:'Menunjukkan bahwa kamu memahami perasaannya' },
  { id:'tf17', axis:'T/F', prompt:'Dalam konflik, kamu lebih dahulu mencari…', a:'Fakta dan urutan kejadian', b:'Perasaan serta kebutuhan yang belum terpenuhi' },
  { id:'tf18', axis:'T/F', prompt:'Kamu merasa paling dihargai ketika orang lain…', a:'Mengakui kompetensi dan pertimbanganmu', b:'Menghargai kepedulian dan ketulusanmu' },
  { id:'tf19', axis:'T/F', prompt:'Saat harus menyampaikan kabar yang sulit, kamu akan…', a:'Menyampaikannya secara jelas dan lugas', b:'Memilih waktu dan cara yang paling menjaga perasaan' },
  { id:'tf20', axis:'T/F', prompt:'Dalam hubungan, kamu cenderung menganggap kompromi yang baik sebagai…', a:'Kesepakatan yang masuk akal bagi keduanya', b:'Kesepakatan yang membuat keduanya merasa dihargai' },

  // Judging / Perceiving — original bank
  { id:'jp01', axis:'J/P', prompt:'Untuk perjalanan bersama, kamu lebih nyaman jika…', a:'Rencana utama sudah disusun', b:'Ada ruang untuk keputusan spontan' },
  { id:'jp02', axis:'J/P', prompt:'Ketika mendapat tugas, kamu biasanya…', a:'Mengerjakannya jauh sebelum tenggat', b:'Mengikuti ritme dan menyelesaikannya mendekati tenggat' },
  { id:'jp03', axis:'J/P', prompt:'Hari libur yang ideal terasa seperti…', a:'Agenda santai yang sudah terpikirkan', b:'Hari bebas tanpa jadwal ketat' },
  { id:'jp04', axis:'J/P', prompt:'Jika rencana mendadak berubah, reaksimu biasanya…', a:'Perlu waktu untuk menata ulang rencana', b:'Mudah menyesuaikan diri' },
  { id:'jp05', axis:'J/P', prompt:'Dalam mengatur barang pribadi, kamu cenderung…', a:'Menyukai tempat yang tetap dan teratur', b:'Menaruhnya sesuai kebutuhan saat itu' },
  // Judging / Perceiving — additional bank
  { id:'jp06', axis:'J/P', prompt:'Saat akan pergi berlibur, kamu biasanya…', a:'Membuat daftar barang dan jadwal sebelumnya', b:'Menyiapkan hal penting lalu berangkat dengan fleksibel' },
  { id:'jp07', axis:'J/P', prompt:'Jika punya beberapa pekerjaan, kamu lebih nyaman…', a:'Menyusun prioritas dan urutan pengerjaan', b:'Berpindah sesuai energi dan inspirasi' },
  { id:'jp08', axis:'J/P', prompt:'Ketika memilih restoran untuk kencan, kamu cenderung…', a:'Memesan tempat lebih dulu', b:'Memutuskan saat sudah dekat waktunya' },
  { id:'jp09', axis:'J/P', prompt:'Kamu merasa lebih tenang ketika…', a:'Hal penting sudah diputuskan', b:'Pilihan masih terbuka dan bisa berubah' },
  { id:'jp10', axis:'J/P', prompt:'Untuk mengelola uang bersama, kamu lebih suka…', a:'Anggaran dan batas pengeluaran yang disepakati', b:'Panduan umum dengan ruang untuk penyesuaian' },
  { id:'jp11', axis:'J/P', prompt:'Jika mendapat undangan mendadak, kamu biasanya…', a:'Memeriksa agenda dan menilai apakah bisa disisipkan', b:'Mempertimbangkan spontan untuk ikut' },
  { id:'jp12', axis:'J/P', prompt:'Saat mengerjakan proyek, kamu lebih suka…', a:'Menyelesaikan satu tahap sebelum berpindah', b:'Mengerjakan beberapa hal sesuai alur ide' },
  { id:'jp13', axis:'J/P', prompt:'Meja kerja yang paling nyaman bagimu adalah…', a:'Rapi dengan barang berada di tempatnya', b:'Fleksibel, selama barang mudah ditemukan' },
  { id:'jp14', axis:'J/P', prompt:'Dalam menentukan waktu bertemu, kamu lebih nyaman…', a:'Menetapkan jam yang pasti', b:'Menentukan rentang waktu lalu menyesuaikan keadaan' },
  { id:'jp15', axis:'J/P', prompt:'Ketika tujuan sudah jelas, kamu cenderung…', a:'Membuat langkah dan tenggat untuk mencapainya', b:'Menjelajah beberapa cara sebelum memilih' },
  { id:'jp16', axis:'J/P', prompt:'Saat menghadapi hari yang sibuk, kamu lebih suka…', a:'Mengikuti daftar kegiatan yang sudah dibuat', b:'Menyesuaikan kegiatan dengan situasi saat itu' },
  { id:'jp17', axis:'J/P', prompt:'Kamu lebih menikmati hadiah yang…', a:'Sudah dipilih dan disiapkan dengan rencana', b:'Muncul sebagai kejutan spontan' },
  { id:'jp18', axis:'J/P', prompt:'Jika ada perubahan jadwal kencan, kamu biasanya…', a:'Segera menyusun rencana pengganti', b:'Menganggapnya kesempatan untuk mencoba hal lain' },
  { id:'jp19', axis:'J/P', prompt:'Dalam menyelesaikan sesuatu, kepuasan terbesarmu datang dari…', a:'Daftar pekerjaan yang selesai satu per satu', b:'Proses mencoba dan menemukan kemungkinan baru' },
  { id:'jp20', axis:'J/P', prompt:'Ketika akhir pekan tiba, kamu lebih suka…', a:'Sudah tahu kegiatan utama yang akan dilakukan', b:'Membiarkan hari berjalan tanpa terlalu banyak rencana' }
];

const PROFILE_DETAILS = {
  ISTJ: { name:'The Steady Planner', description:'Kamu cenderung tenang, realistis, logis, dan menyukai kejelasan. Kamu biasanya menunjukkan kepedulian melalui konsistensi dan tindakan nyata.', strengths:'Dapat diandalkan, teliti, bertanggung jawab, dan kuat menjaga komitmen.', communication:'Lebih nyaman dengan komunikasi langsung, spesifik, dan berdasarkan fakta. Beri waktu untuk memikirkan hal penting sebelum mengambil keputusan.', relationship:'Kamu sering mengekspresikan sayang dengan hadir tepat waktu, menepati janji, dan membantu hal praktis. Rutinitas yang aman bisa membuatmu merasa dekat.', growth:'Coba sampaikan perasaan secara eksplisit, bukan hanya melalui tindakan. Sisakan ruang untuk perubahan spontan.' },
  ISFJ: { name:'The Gentle Keeper', description:'Kamu cenderung hangat, praktis, perhatian, dan menghargai hubungan yang stabil. Detail kecil dan kebutuhan orang terdekat mudah kamu perhatikan.', strengths:'Peka, suportif, tekun, setia, dan mampu menjaga kebersamaan.', communication:'Kamu menghargai nada bicara yang lembut, penghargaan yang tulus, dan percakapan yang memberi rasa aman.', relationship:'Kamu mungkin menunjukkan kasih sayang lewat perhatian sehari-hari dan mengingat hal-hal kecil yang penting bagi pasangan.', growth:'Jangan selalu mendahulukan kebutuhan orang lain. Sampaikan batas dan kebutuhanmu sendiri.' },
  INFJ: { name:'The Quiet Dreamer', description:'Kamu cenderung reflektif, intuitif, berorientasi nilai, dan mencari makna di balik pengalaman. Kamu menyukai kedekatan yang mendalam.', strengths:'Empatik, visioner, penuh pertimbangan, dan mampu melihat hubungan antargagasan.', communication:'Kamu menyukai percakapan bermakna, kejujuran, dan kesempatan memahami konteks emosional.', relationship:'Kamu mungkin membutuhkan ikatan yang terasa tulus dan sejalan dengan nilai hidup, bukan sekadar sering bersama.', growth:'Jangan mengharapkan pasangan selalu membaca pikiranmu. Sampaikan ekspektasi dan cek kembali asumsi.' },
  INTJ: { name:'The Thoughtful Strategist', description:'Kamu cenderung mandiri, analitis, dan memikirkan tujuan jangka panjang. Kamu suka memahami sistem sebelum memilih langkah.', strengths:'Strategis, fokus, mandiri, dan kuat menyusun solusi.', communication:'Kamu menghargai argumen yang jelas, ruang berpikir, dan diskusi yang tidak berputar-putar.', relationship:'Kamu bisa menunjukkan perhatian dengan membantu pasangan merencanakan masa depan dan menyelesaikan masalah.', growth:'Ingat bahwa tidak semua percakapan membutuhkan solusi. Terkadang pasangan hanya ingin didengar.' },
  ISTP: { name:'The Calm Problem-Solver', description:'Kamu cenderung praktis, mandiri, tenang, dan belajar paling baik dengan mencoba langsung. Kamu suka kebebasan dalam menyelesaikan masalah.', strengths:'Adaptif, observatif, terampil, dan mampu tetap tenang saat keadaan berubah.', communication:'Kamu lebih nyaman dengan pembicaraan konkret dan tidak terlalu menekan.', relationship:'Kamu dapat menunjukkan sayang lewat bantuan nyata, aktivitas bersama, dan memberi pasangan ruang.', growth:'Latih kebiasaan menjelaskan perasaan dan rencana agar sikap tenangmu tidak disalahartikan sebagai tidak peduli.' },
  ISFP: { name:'The Soft Explorer', description:'Kamu cenderung peka, hangat, fleksibel, dan menghargai pengalaman personal. Kamu sering memperhatikan suasana dan keaslian.', strengths:'Empatik, kreatif, rendah hati, dan menghormati perbedaan.', communication:'Kamu menghargai percakapan yang tulus, tidak menghakimi, dan memberi ruang untuk merasakan sesuatu.', relationship:'Kamu mungkin menyampaikan kasih sayang melalui momen kecil, pengalaman bersama, dan perhatian yang personal.', growth:'Ketika ada masalah, jangan hanya menghindar demi menjaga suasana. Sampaikan kebutuhan dengan jelas.' },
  INFP: { name:'The Heartful Idealist', description:'Kamu cenderung imajinatif, reflektif, dan berpegang pada nilai pribadi. Kamu mencari hubungan yang terasa autentik dan bermakna.', strengths:'Imajinatif, penuh empati, idealis, dan setia pada hal yang diyakini.', communication:'Kamu menyukai percakapan yang jujur, hangat, dan tidak meremehkan perasaan.', relationship:'Kamu dapat membangun kedekatan melalui perhatian personal, dukungan terhadap mimpi, dan makna di balik momen bersama.', growth:'Seimbangkan harapan ideal dengan kondisi nyata. Bicarakan perbedaan sebelum berubah menjadi kekecewaan.' },
  INTP: { name:'The Curious Thinker', description:'Kamu cenderung analitis, ingin tahu, dan senang mengeksplorasi ide. Kamu menikmati kebebasan untuk memahami sesuatu dengan caramu sendiri.', strengths:'Kritis, kreatif, independen, dan terbuka pada gagasan baru.', communication:'Kamu menikmati diskusi mendalam, pertanyaan, dan kesempatan menguji ide tanpa cepat menghakimi.', relationship:'Kamu mungkin menunjukkan perhatian dengan berbagi pengetahuan, memecahkan masalah, dan menghargai ruang pribadi.', growth:'Ingat untuk menyatakan apresiasi secara emosional, bukan hanya lewat diskusi atau solusi.' },
  ESTP: { name:'The Bold Doer', description:'Kamu cenderung aktif, realistis, spontan, dan suka belajar dari pengalaman langsung. Kamu senang bergerak dan menghadapi tantangan.', strengths:'Berani, tanggap, praktis, dan cepat beradaptasi.', communication:'Kamu menyukai komunikasi lugas, ritme cepat, dan pembahasan yang berujung tindakan.', relationship:'Kamu dapat menunjukkan kasih sayang lewat mengajak mencoba hal baru dan hadir saat pasangan membutuhkan bantuan.', growth:'Berhenti sejenak untuk mempertimbangkan dampak jangka panjang dan kebutuhan emosional pasangan.' },
  ESFP: { name:'The Joyful Connector', description:'Kamu cenderung ekspresif, hangat, praktis, dan menikmati pengalaman bersama. Kamu mudah membawa energi positif ke lingkungan.', strengths:'Ramah, spontan, suportif, dan pandai menciptakan suasana menyenangkan.', communication:'Kamu menyukai respons yang hangat, interaksi langsung, dan apresiasi yang terlihat.', relationship:'Kamu mungkin mengekspresikan kasih sayang melalui waktu berkualitas, kejutan kecil, dan kegiatan bersama.', growth:'Berikan ruang untuk pembicaraan serius dan rencana jangka panjang, meski suasana tidak selalu menyenangkan.' },
  ENFP: { name:'The Bright Explorer', description:'Kamu cenderung antusias, imajinatif, terbuka pada kemungkinan, dan tertarik pada hubungan yang memberi ruang tumbuh.', strengths:'Kreatif, penuh semangat, empatik, dan mampu melihat potensi.', communication:'Kamu menyukai percakapan terbuka, ide baru, dan tanggapan yang menunjukkan ketertarikan.', relationship:'Kamu sering membangun kedekatan melalui pengalaman baru, dukungan terhadap mimpi, dan ekspresi yang spontan.', growth:'Pilih beberapa prioritas dan jaga konsistensi pada komitmen yang sudah disepakati.' },
  ENTP: { name:'The Playful Inventor', description:'Kamu cenderung cepat berpikir, suka mengeksplorasi ide, dan menikmati tantangan. Kamu senang menguji cara pandang yang berbeda.', strengths:'Inovatif, luwes, argumentatif secara konstruktif, dan penuh ide.', communication:'Kamu menikmati diskusi, humor, dan ruang untuk berbeda pendapat tanpa dianggap menyerang.', relationship:'Kamu dapat menjaga hubungan tetap hidup dengan ide baru dan obrolan yang menstimulasi.', growth:'Tidak semua perbedaan perlu diperdebatkan. Perhatikan kapan pasangan membutuhkan validasi, bukan solusi atau debat.' },
  ESTJ: { name:'The Clear Organizer', description:'Kamu cenderung tegas, realistis, terstruktur, dan berorientasi hasil. Kamu menghargai tanggung jawab dan kesepakatan yang jelas.', strengths:'Terorganisasi, konsisten, tegas, dan kuat dalam mengoordinasikan pekerjaan.', communication:'Kamu menyukai tujuan yang jelas, pembagian tugas, dan keputusan yang dapat dijalankan.', relationship:'Kamu mungkin menunjukkan sayang dengan menjaga komitmen, merencanakan kebutuhan, dan memastikan hal penting terselesaikan.', growth:'Coba dengarkan cara pasangan memproses sesuatu yang berbeda dari caramu. Fleksibilitas bukan berarti kehilangan arah.' },
  ESFJ: { name:'The Warm Host', description:'Kamu cenderung ramah, suportif, dan memperhatikan harmoni. Kamu mudah menyadari kebutuhan sosial serta suasana kelompok.', strengths:'Peduli, komunikatif, kooperatif, dan pandai menjaga hubungan.', communication:'Kamu menghargai respons yang hangat, penghargaan, dan kepastian bahwa hubungan baik-baik saja.', relationship:'Kamu dapat menunjukkan kasih sayang dengan merawat rutinitas bersama dan mengingat kebutuhan pasangan.', growth:'Jangan mengukur nilai diri dari seberapa banyak kamu menyenangkan orang lain. Berani menyatakan ketidaksetujuan.' },
  ENFJ: { name:'The Heartful Guide', description:'Kamu cenderung ekspresif, intuitif, dan peka terhadap perkembangan orang lain. Kamu senang mendukung orang mencapai potensinya.', strengths:'Empatik, komunikatif, inspiratif, dan kuat membangun kerja sama.', communication:'Kamu menyukai dialog terbuka, umpan balik yang hangat, dan tujuan bersama.', relationship:'Kamu mungkin aktif memberi dukungan, menyemangati pasangan, dan membangun visi masa depan berdua.', growth:'Jangan mengambil tanggung jawab atas semua emosi pasangan. Beri ruang bagi mereka untuk menentukan pilihannya.' },
  ENTJ: { name:'The Decisive Builder', description:'Kamu cenderung strategis, tegas, dan berorientasi tujuan. Kamu menikmati tantangan serta menggerakkan ide menjadi tindakan.', strengths:'Visioner, terarah, percaya diri, dan mampu mengambil keputusan.', communication:'Kamu menghargai diskusi langsung, alasan yang kuat, dan komitmen yang jelas.', relationship:'Kamu dapat menunjukkan perhatian melalui perencanaan, perlindungan, dan usaha membangun masa depan.', growth:'Pastikan pasangan merasa dilibatkan, bukan hanya mengikuti rencanamu. Beri ruang untuk kelembutan dan kerentanan.' }
};

export function seededShuffle(items, seed = 1) {
  const result = [...items];
  let value = (Number(seed) || 1) >>> 0;
  const random = () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createRandomSeed() {
  try {
    const value = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(value);
    if (value[0]) return value[0];
  } catch { /* Use a timestamp fallback below. */ }
  return ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) || 1;
}

export function selectLoveQuestions(seed = createRandomSeed(), perAxis = 8) {
  const selected = LOVE_AXES.flatMap((axis, index) => {
    const axisQuestions = LOVE_QUESTIONS.filter(question => question.axis === axis);
    return seededShuffle(axisQuestions, (Number(seed) + (index + 1) * 7919) >>> 0).slice(0, Math.min(perAxis, axisQuestions.length));
  });
  return seededShuffle(selected, (Number(seed) ^ 0x4c4f5645) >>> 0);
}

function normalizeAnswers(answers, total) {
  if (Array.isArray(answers)) return answers;
  return Array.from({ length: total }, (_, index) => answers?.[index] ?? answers?.[String(index)] ?? null);
}

export function loveProfile(answers = [], questionSet = LOVE_QUESTIONS) {
  const normalizedAnswers = normalizeAnswers(answers, questionSet.length);
  const letters = LOVE_AXES.map(axis => {
    const group = questionSet.map((question, index) => question.axis === axis ? normalizedAnswers[index] : null).filter(Boolean);
    const aCount = group.filter(value => value === 'A').length;
    const bCount = group.filter(value => value === 'B').length;
    return aCount >= bCount ? axis.split('/')[0] : axis.split('/')[1];
  });
  const code = letters.join('');
  return { code, ...PROFILE_DETAILS[code] };
}

export function calculateLoveMatch(hostAnswers = [], guestAnswers = [], questionSet = LOVE_QUESTIONS) {
  const host = normalizeAnswers(hostAnswers, questionSet.length);
  const guest = normalizeAnswers(guestAnswers, questionSet.length);
  const total = questionSet.length;
  const matched = Array.from({ length: total }, (_, index) => host[index] && guest[index] && host[index] === guest[index]).filter(Boolean).length;
  const axes = {};
  for (const axis of LOVE_AXES) {
    const indices = questionSet.map((question, index) => question.axis === axis ? index : -1).filter(index => index >= 0);
    const same = indices.filter(index => host[index] && host[index] === guest[index]).length;
    axes[axis] = indices.length ? Math.round((same / indices.length) * 100) : 0;
  }
  return {
    score: total ? Math.round((matched / total) * 100) : 0,
    matched,
    total,
    axes,
    hostProfile: loveProfile(host, questionSet),
    guestProfile: loveProfile(guest, questionSet)
  };
}

export function colorAccuracy(target, guess) {
  const channels = ['r', 'g', 'b'];
  const error = channels.reduce((sum, key) => sum + Math.abs(Number(target?.[key] || 0) - Number(guess?.[key] || 0)), 0) / 3;
  return { error: Math.round(error), score: Math.max(0, Math.round(100 - error / 2.55)) };
}

export function colorHex(color) {
  return `#${['r', 'g', 'b'].map(key => Math.max(0, Math.min(255, Math.round(Number(color?.[key]) || 0))).toString(16).padStart(2, '0')).join('')}`;
}

function secureRandom() {
  try {
    const value = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(value);
    if (value[0]) return value[0] / 4294967296;
  } catch { /* Math.random fallback for older browsers. */ }
  return Math.random();
}

export function makeColor(random = secureRandom) {
  const channel = () => Math.floor(35 + random() * 186);
  return { r: channel(), g: channel(), b: channel() };
}

export function makeDistinctColor(previousColors = [], random = secureRandom) {
  const previous = Array.isArray(previousColors) ? previousColors : [];
  let next = makeColor(random);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const tooSimilar = previous.some(color => ['r','g','b'].every(key => Math.abs(Number(color?.[key] || 0) - next[key]) < 24));
    if (!tooSimilar) break;
    next = makeColor(random);
  }
  return next;
}

export const IQ_QUESTIONS = [
  { id: 'p01', category: 'POLA · MATRIKS', prompt: 'Berapa titik yang harus mengisi kotak kosong?', visualGrid: ['●', '●●', '●●●', '●●', '●●●', '●●●●', '●●●', '●●●●', '?'], options: ['●●', '●●●●●●', '●●●●●', '●●●'], answer: 2, explanation: 'Jumlah titik bertambah satu dari kiri ke kanan dan dari atas ke bawah.' },
  { id: 'p02', category: 'POLA', prompt: 'Pilih simbol berikutnya.', visual: ['▲', '■', '▲', '■', '▲', '?'], options: ['▲', '■', '●', '◆'], answer: 1, explanation: 'Dua simbol bergantian: segitiga, persegi.' },
  { id: 'p03', category: 'POLA', prompt: 'Lengkapi urutan bentuk.', visual: ['○', '○○', '○○○', '○○○○', '?'], options: ['○○', '○○○○○', '○○○', '○'], answer: 1, explanation: 'Setiap langkah menambah satu lingkaran.' },
  { id: 'p04', category: 'POLA', prompt: 'Arah panah berputar seperempat putaran searah jarum jam. Berikutnya?', visual: ['↑', '→', '↓', '?'], options: ['←', '↑', '↗', '↓'], answer: 0, explanation: 'Panah berputar 90° searah jarum jam.' },
  { id: 'p05', category: 'POLA', prompt: 'Pilih pasangan yang melanjutkan pola.', visual: ['A1', 'B2', 'C3', 'D4', '?'], options: ['E4', 'D5', 'E5', 'F5'], answer: 2, explanation: 'Huruf dan angka sama-sama naik satu.' },
  { id: 's01', category: 'DERET', prompt: 'Angka berikutnya: 3, 6, 12, 24, …', options: ['30', '36', '42', '48'], answer: 3, explanation: 'Setiap angka dikalikan dua.' },
  { id: 's02', category: 'DERET', prompt: 'Angka berikutnya: 2, 5, 9, 14, 20, …', options: ['25', '26', '27', '28'], answer: 2, explanation: 'Selisihnya +3, +4, +5, +6, lalu +7.' },
  { id: 's03', category: 'DERET', prompt: 'Angka berikutnya: 81, 27, 9, 3, …', options: ['0', '1', '2', '6'], answer: 1, explanation: 'Setiap angka dibagi tiga.' },
  { id: 's04', category: 'DERET', prompt: 'Angka berikutnya: 1, 4, 9, 16, 25, …', options: ['30', '32', '36', '49'], answer: 2, explanation: 'Ini adalah kuadrat 1, 2, 3, 4, 5, lalu 6.' },
  { id: 's05', category: 'DERET', prompt: 'Angka berikutnya: Fibonacci 1, 1, 2, 3, 5, 8, …', options: ['11', '12', '13', '15'], answer: 2, explanation: 'Setiap angka adalah jumlah dua angka sebelumnya.' },
  { id: 'l01', category: 'LOGIKA', prompt: 'Semua mawar adalah bunga. Sebagian bunga cepat layu. Kesimpulan yang pasti benar?', options: ['Semua mawar cepat layu', 'Sebagian mawar pasti cepat layu', 'Mawar termasuk bunga', 'Tidak ada bunga yang tahan lama'], answer: 2, explanation: 'Hanya pernyataan bahwa mawar termasuk bunga yang dijamin.' },
  { id: 'l02', category: 'LOGIKA', prompt: 'Jika hari hujan, jalan basah. Hari ini jalan tidak basah. Apa kesimpulan paling kuat?', options: ['Hari ini pasti hujan', 'Hari ini tidak hujan', 'Jalan sedang ditutup', 'Tidak dapat disimpulkan apa pun'], answer: 1, explanation: 'Dengan aturan yang diberikan, tidak basah berarti kondisi hujan tidak terjadi.' },
  { id: 'l03', category: 'LOGIKA', prompt: 'Rani lebih tinggi dari Dita. Dita lebih tinggi dari Sari. Siapa paling pendek?', options: ['Rani', 'Dita', 'Sari', 'Tidak dapat diketahui'], answer: 2, explanation: 'Urutannya Rani > Dita > Sari.' },
  { id: 'l04', category: 'LOGIKA', prompt: 'Ada 5 kotak. Setiap kotak berisi 2 bola. Berapa bola minimal yang perlu diambil tanpa melihat untuk memastikan mendapat 2 bola dengan warna sama, jika hanya ada 2 warna?', options: ['2', '3', '4', '5'], answer: 1, explanation: 'Dengan 2 warna, tiga pengambilan pasti memuat dua bola berwarna sama.' },
  { id: 'l05', category: 'LOGIKA', prompt: 'Jika semua A adalah B dan tidak ada B yang C, maka…', options: ['Semua A adalah C', 'Sebagian A adalah C', 'Tidak ada A yang C', 'Semua C adalah A'], answer: 2, explanation: 'A berada di kelompok B, sedangkan B tidak beririsan dengan C.' },
  { id: 'm01', category: 'HITUNG CEPAT', prompt: '18 × 7 = …', options: ['116', '126', '136', '146'], answer: 1, explanation: '18 × 7 = 126.' },
  { id: 'm02', category: 'HITUNG CEPAT', prompt: 'Harga Rp80.000 mendapat diskon 25%. Harga akhirnya?', options: ['Rp55.000', 'Rp60.000', 'Rp62.500', 'Rp65.000'], answer: 1, explanation: 'Diskon Rp20.000, jadi harga akhir Rp60.000.' },
  { id: 'm03', category: 'HITUNG CEPAT', prompt: 'Jika 4 orang menyelesaikan pekerjaan dalam 6 hari, berapa hari untuk 8 orang dengan kecepatan sama?', options: ['2', '3', '4', '12'], answer: 1, explanation: 'Jumlah pekerja dua kali lipat, waktu menjadi setengahnya.' },
  { id: 'm04', category: 'HITUNG CEPAT', prompt: 'Setengah dari 3/4 adalah…', options: ['1/4', '3/8', '2/3', '1/2'], answer: 1, explanation: '3/4 dibagi 2 = 3/8.' },
  { id: 'm05', category: 'HITUNG CEPAT', prompt: 'Sebuah kereta menempuh 150 km dalam 2,5 jam. Kecepatan rata-ratanya?', options: ['50 km/jam', '55 km/jam', '60 km/jam', '65 km/jam'], answer: 2, explanation: '150 ÷ 2,5 = 60 km/jam.' },
  { id: 'a01', category: 'ANALOGI', prompt: 'Buku : membaca = garpu : …', options: ['menulis', 'memotong', 'makan', 'memasak'], answer: 2, explanation: 'Buku digunakan untuk membaca, garpu digunakan untuk makan.' },
  { id: 'a02', category: 'ANALOGI', prompt: 'Dokter : rumah sakit = guru : …', options: ['perpustakaan', 'sekolah', 'pasar', 'stasiun'], answer: 1, explanation: 'Tempat kerja yang paling sesuai adalah sekolah.' },
  { id: 'a03', category: 'ANALOGI', prompt: 'Panas : dingin = terang : …', options: ['lampu', 'gelap', 'siang', 'matahari'], answer: 1, explanation: 'Hubungannya adalah pasangan berlawanan.' },
  { id: 'a04', category: 'ANALOGI', prompt: 'Benih : pohon = telur : …', options: ['sarang', 'ayam', 'bulu', 'cangkang'], answer: 1, explanation: 'Benih dapat tumbuh menjadi pohon, telur dapat menetas menjadi ayam.' },
  { id: 'a05', category: 'ANALOGI', prompt: 'Menit : waktu = meter : …', options: ['jarak', 'berat', 'kecepatan', 'suhu'], answer: 0, explanation: 'Menit mengukur waktu, meter mengukur jarak.' },
  { id: 'p06', category: 'POLA · MATRIKS', prompt: 'Simbol apa yang melengkapi pola kotak 3 × 3?', visualGrid: ['▲', '■', '●', '■', '●', '▲', '●', '▲', '?'], options: ['▲', '■', '●', '◆'], answer: 1, explanation: 'Setiap baris dan kolom memutar urutan segitiga, persegi, dan lingkaran.' },
  { id: 's06', category: 'DERET', prompt: 'Angka berikutnya: 5, 10, 8, 16, 14, 28, …', options: ['24', '26', '30', '56'], answer: 1, explanation: 'Polanya dikali 2, lalu dikurangi 2 secara bergantian.' },
  { id: 'l06', category: 'LOGIKA', prompt: 'Andi tiba sebelum Bima. Citra tiba setelah Bima. Siapa yang tiba paling awal?', options: ['Andi', 'Bima', 'Citra', 'Tidak diketahui'], answer: 0, explanation: 'Urutan kedatangan Andi, Bima, lalu Citra.' },
  { id: 'm06', category: 'HITUNG CEPAT', prompt: '15% dari 240 adalah…', options: ['24', '30', '36', '42'], answer: 2, explanation: '10% = 24 dan 5% = 12, total 36.' },
  { id: 'a06', category: 'ANALOGI', prompt: 'Kunci : pintu = kata sandi : …', options: ['akun', 'layar', 'keyboard', 'internet'], answer: 0, explanation: 'Kunci membuka pintu, kata sandi membuka akses akun.' },
  // Additional original question bank — patterns
  { id:'p07', category:'POLA', prompt:'Simbol berikutnya: ▲, ●, ■, ▲, ●, …', visual:['▲','●','■','▲','●','?'], options:['▲','●','■','◆'], answer:2, explanation:'Urutannya berulang setiap tiga simbol: segitiga, lingkaran, persegi.' },
  { id:'p08', category:'POLA', prompt:'Lengkapi urutan: 2, 4, 8, 16, …', options:['18','24','30','32'], answer:3, explanation:'Setiap angka dikalikan dua.' },
  { id:'p09', category:'POLA', prompt:'Jika pola warna berganti merah, biru, biru, merah, biru, biru, …, warna berikutnya?', options:['Merah','Biru','Hijau','Kuning'], answer:0, explanation:'Pola tiga langkah berulang: merah, biru, biru.' },
  { id:'p10', category:'POLA · MATRIKS', prompt:'Tanda apa yang melengkapi kotak 3 × 3?', visualGrid:['○','△','□','△','□','○','□','○','?'], options:['○','△','□','◇'], answer:1, explanation:'Setiap baris dan kolom menggunakan tiga bentuk yang sama dengan urutan bergeser.' },
  { id:'p11', category:'POLA', prompt:'Pilih kelanjutan urutan: AZ, BY, CX, DW, …', options:['EV','EU','FV','EX'], answer:0, explanation:'Huruf pertama maju satu, huruf kedua mundur satu: E dan V.' },
  { id:'p12', category:'POLA', prompt:'Sebuah bentuk diputar 180° setiap langkah. Setelah ↑, ↓, ↑, … berikutnya?', options:['←','→','↑','↓'], answer:3, explanation:'Arah berganti atas dan bawah secara bergantian.' },
  { id:'p13', category:'POLA', prompt:'Lengkapi pasangan: 1A, 2C, 3E, 4G, …', options:['5H','5I','6I','5J'], answer:1, explanation:'Angka naik satu, sedangkan huruf maju dua posisi: A, C, E, G, I.' },
  { id:'p14', category:'POLA', prompt:'Berapa sisi pada bentuk berikutnya: segitiga, persegi, segilima, …?', options:['5','6','7','8'], answer:1, explanation:'Jumlah sisi bertambah satu: 3, 4, 5, lalu 6.' },
  { id:'p15', category:'POLA', prompt:'Urutan angka: 1, 3, 6, 10, 15, …', options:['18','20','21','24'], answer:2, explanation:'Penambahannya berurutan +2, +3, +4, +5, lalu +6.' },
  { id:'p16', category:'POLA · MATRIKS', prompt:'Lengkapi kotak 3 × 3 dengan jumlah bintang yang tepat.', visualGrid:['★','★★','★★★','★★','★★★','★★★★','★★★','★★★★','?'], options:['★★★★','★★★★★','★★★★★★','★★★★★★★'], answer:2, explanation:'Jumlah bintang bertambah satu ke kanan dan satu ke bawah; kotak terakhir berisi enam bintang.' },
  // Series
  { id:'s07', category:'DERET', prompt:'Angka berikutnya: 4, 7, 13, 22, 34, …', options:['45','47','49','52'], answer:2, explanation:'Selisih bertambah 3: +3, +6, +9, +12, lalu +15.' },
  { id:'s08', category:'DERET', prompt:'Angka berikutnya: 100, 90, 81, 73, 66, …', options:['58','59','60','61'], answer:1, explanation:'Selisihnya −10, −9, −8, −7, lalu −6.' },
  { id:'s09', category:'DERET', prompt:'Angka berikutnya: 2, 6, 18, 54, …', options:['108','126','144','162'], answer:3, explanation:'Setiap angka dikalikan tiga.' },
  { id:'s10', category:'DERET', prompt:'Angka berikutnya: 7, 10, 16, 25, 37, …', options:['49','50','52','54'], answer:2, explanation:'Selisihnya +3, +6, +9, +12, lalu +15.' },
  { id:'s11', category:'DERET', prompt:'Angka berikutnya: 1, 2, 6, 24, 120, …', options:['480','600','720','840'], answer:2, explanation:'Setiap langkah dikalikan 2, 3, 4, 5, lalu 6.' },
  { id:'s12', category:'DERET', prompt:'Angka berikutnya: 64, 32, 16, 8, …', options:['2','3','4','6'], answer:2, explanation:'Setiap angka dibagi dua.' },
  { id:'s13', category:'DERET', prompt:'Angka berikutnya: 4, 9, 19, 39, …', options:['59','69','79','89'], answer:2, explanation:'Setiap angka dikalikan dua lalu ditambah satu.' },
  { id:'s14', category:'DERET', prompt:'Angka berikutnya: 2, 3, 5, 8, 13, …', options:['18','20','21','23'], answer:2, explanation:'Setiap angka merupakan jumlah dua angka sebelumnya.' },
  { id:'s15', category:'DERET', prompt:'Angka berikutnya: 50, 45, 37, 26, 12, …', options:['−5','−2','0','2'], answer:0, explanation:'Selisihnya −5, −8, −11, dan −14. Selisih berikutnya −17, sehingga 12 − 17 = −5.' },
  { id:'s16', category:'DERET', prompt:'Angka berikutnya: 1, 8, 27, 64, …', options:['100','121','125','144'], answer:2, explanation:'Deret kubik: 1³, 2³, 3³, 4³, lalu 5³.' },
  // Logic
  { id:'l07', category:'LOGIKA', prompt:'Semua peserta yang lolos mengirim formulir. Naya mengirim formulir. Kesimpulan yang pasti?', options:['Naya pasti lolos','Naya pasti tidak lolos','Naya mengirim formulir','Semua pengirim formulir lolos'], answer:2, explanation:'Aturan hanya menyatakan peserta lolos mengirim formulir; pengirim formulir belum tentu lolos.' },
  { id:'l08', category:'LOGIKA', prompt:'Mira lebih tua dari Riko. Riko lebih tua dari Tia. Pernyataan yang benar?', options:['Tia paling tua','Mira lebih tua dari Tia','Riko lebih tua dari Mira','Usia mereka sama'], answer:1, explanation:'Urutannya Mira > Riko > Tia.' },
  { id:'l09', category:'LOGIKA', prompt:'Jika lampu menyala, listrik tersedia. Lampu tidak menyala. Apa yang dapat dipastikan?', options:['Listrik pasti padam','Bola lampu pasti rusak','Tidak ada kesimpulan pasti tentang listrik','Sakelar pasti rusak'], answer:2, explanation:'Lampu dapat tidak menyala karena beberapa sebab; kondisi listrik tidak dapat dipastikan.' },
  { id:'l10', category:'LOGIKA', prompt:'Ada tiga kotak: merah, biru, hijau. Kunci bukan di merah atau hijau. Di mana kunci?', options:['Merah','Biru','Hijau','Tidak diketahui'], answer:1, explanation:'Jika bukan merah dan bukan hijau, satu-satunya pilihan adalah biru.' },
  { id:'l11', category:'LOGIKA', prompt:'Semua anggota klub membaca buku. Deni anggota klub. Maka…', options:['Deni membaca buku','Deni menulis buku','Semua pembaca anggota klub','Deni ketua klub'], answer:0, explanation:'Deni termasuk anggota klub, sehingga mengikuti sifat semua anggota klub.' },
  { id:'l12', category:'LOGIKA', prompt:'Empat orang antre. Lala di depan Beni, Beni di depan Cici, dan Dodi di belakang Cici. Siapa paling belakang?', options:['Lala','Beni','Cici','Dodi'], answer:3, explanation:'Urutan antre adalah Lala, Beni, Cici, lalu Dodi.' },
  { id:'l13', category:'LOGIKA', prompt:'Jika hari ini bukan Senin dan bukan Selasa, serta besok Jumat, hari ini adalah…', options:['Rabu','Kamis','Jumat','Sabtu'], answer:1, explanation:'Jika besok Jumat, hari ini Kamis.' },
  { id:'l14', category:'LOGIKA', prompt:'Semua kucing adalah mamalia. Tidak ada mamalia yang bertelur. Kesimpulan?', options:['Semua kucing bertelur','Tidak ada kucing yang bertelur','Sebagian kucing bertelur','Semua mamalia adalah kucing'], answer:1, explanation:'Kucing termasuk mamalia, sedangkan mamalia tidak bertelur menurut premis.' },
  { id:'l15', category:'LOGIKA', prompt:'Tiga lampu menyala bergantian. Saat lampu A menyala, B dan C mati. Saat B menyala, A dan C mati. Apa yang pasti?', options:['Dua lampu selalu menyala','Paling banyak satu lampu menyala pada satu waktu','Semua lampu selalu mati','A dan B selalu menyala bersama'], answer:1, explanation:'Setiap kondisi menyatakan satu lampu menyala dan dua lainnya mati.' },
  { id:'l16', category:'LOGIKA', prompt:'Jika Rani datang, rapat dimulai. Rapat belum dimulai. Dengan aturan itu, apa kesimpulannya?', options:['Rani belum datang','Rani sudah datang','Rapat dibatalkan','Tidak ada peserta'], answer:0, explanation:'Berdasarkan implikasi yang diberikan, jika rapat belum dimulai maka kondisi Rani datang belum terjadi.' },
  // Arithmetic
  { id:'m07', category:'HITUNG CEPAT', prompt:'35% dari 200 adalah…', options:['60','65','70','75'], answer:2, explanation:'30% dari 200 adalah 60 dan 5% adalah 10; total 70.' },
  { id:'m08', category:'HITUNG CEPAT', prompt:'3/5 dari 80 adalah…', options:['42','45','48','52'], answer:2, explanation:'80 ÷ 5 × 3 = 48.' },
  { id:'m09', category:'HITUNG CEPAT', prompt:'2,4 × 5 = …', options:['10','11','12','14'], answer:2, explanation:'2,4 dikalikan 5 menghasilkan 12.' },
  { id:'m10', category:'HITUNG CEPAT', prompt:'Tiga pekerja menyelesaikan tugas dalam 12 hari. Dengan kecepatan sama, enam pekerja memerlukan…', options:['4 hari','5 hari','6 hari','8 hari'], answer:2, explanation:'Jumlah pekerja menjadi dua kali lipat, sehingga waktu menjadi setengahnya.' },
  { id:'m11', category:'HITUNG CEPAT', prompt:'Perbandingan A : B = 2 : 3. Jika jumlahnya 40, nilai A adalah…', options:['12','16','20','24'], answer:1, explanation:'Total bagian 5; satu bagian 8. A = 2 × 8 = 16.' },
  { id:'m12', category:'HITUNG CEPAT', prompt:'1 jam 45 menit ditambah 35 menit menjadi…', options:['2 jam 10 menit','2 jam 15 menit','2 jam 20 menit','2 jam 30 menit'], answer:2, explanation:'45 + 35 = 80 menit, yaitu 1 jam 20 menit; ditambah 1 jam menjadi 2 jam 20 menit.' },
  { id:'m13', category:'HITUNG CEPAT', prompt:'Harga Rp80.000 naik 25%. Harga barunya adalah…', options:['Rp90.000','Rp95.000','Rp100.000','Rp105.000'], answer:2, explanation:'25% dari Rp80.000 adalah Rp20.000; totalnya Rp100.000.' },
  { id:'m14', category:'HITUNG CEPAT', prompt:'Lima buku berharga Rp75.000. Jika harga per buku sama, tiga buku berharga…', options:['Rp35.000','Rp40.000','Rp45.000','Rp50.000'], answer:2, explanation:'Satu buku Rp15.000, sehingga tiga buku Rp45.000.' },
  { id:'m15', category:'HITUNG CEPAT', prompt:'Luas persegi panjang dengan panjang 12 cm dan lebar 7 cm adalah…', options:['19 cm²','38 cm²','72 cm²','84 cm²'], answer:3, explanation:'Luas = panjang × lebar = 12 × 7 = 84 cm².' },
  { id:'m16', category:'HITUNG CEPAT', prompt:'Keliling persegi 36 cm. Panjang satu sisinya adalah…', options:['6 cm','8 cm','9 cm','12 cm'], answer:2, explanation:'Keliling persegi = 4 × sisi, jadi sisi = 36 ÷ 4 = 9 cm.' },
  // Analogies
  { id:'a07', category:'ANALOGI', prompt:'Kuas : melukis = pena : …', options:['menghapus','menulis','mengukur','memotong'], answer:1, explanation:'Kuas digunakan untuk melukis, pena digunakan untuk menulis.' },
  { id:'a08', category:'ANALOGI', prompt:'Burung : sarang = lebah : …', options:['kolam','sarang lebah','ranting','gua'], answer:1, explanation:'Sarang adalah tempat tinggal burung; sarang lebah adalah tempat tinggal koloni lebah.' },
  { id:'a09', category:'ANALOGI', prompt:'Mata : melihat = telinga : …', options:['berbicara','mendengar','mencium','menyentuh'], answer:1, explanation:'Mata berfungsi untuk melihat, telinga untuk mendengar.' },
  { id:'a10', category:'ANALOGI', prompt:'Koki : dapur = pilot : …', options:['hanggar','kokpit','terminal','landasan'], answer:1, explanation:'Koki bekerja di dapur; pilot mengendalikan pesawat dari kokpit.' },
  { id:'a11', category:'ANALOGI', prompt:'Jam : waktu = termometer : …', options:['jarak','suhu','berat','kecepatan'], answer:1, explanation:'Jam mengukur waktu, termometer mengukur suhu.' },
  { id:'a12', category:'ANALOGI', prompt:'Sisir : rambut = sikat : …', options:['gigi','sepatu','kertas','piring'], answer:0, explanation:'Sisir digunakan untuk merapikan rambut; sikat gigi digunakan untuk membersihkan gigi.' },
  { id:'a13', category:'ANALOGI', prompt:'Gunting : memotong = lem : …', options:['menempel','mengukur','melipat','menggambar'], answer:0, explanation:'Gunting digunakan untuk memotong, lem digunakan untuk menempel.' },
  { id:'a14', category:'ANALOGI', prompt:'Matahari : siang = bulan : …', options:['pagi','sore','malam','musim'], answer:2, explanation:'Matahari paling terkait dengan siang, bulan dengan malam dalam konteks umum.' },
  { id:'a15', category:'ANALOGI', prompt:'Kata : kalimat = batu bata : …', options:['semen','dinding','atap','pintu'], answer:1, explanation:'Kata menyusun kalimat, batu bata menyusun dinding.' },
  { id:'a16', category:'ANALOGI', prompt:'Jari tangan : tangan = jari kaki : …', options:['lutut','kaki','sepatu','telapak'], answer:1, explanation:'Jari tangan merupakan bagian dari tangan, jari kaki bagian dari kaki.' },
  // Additional bank to broaden random selection to 100 questions.
  { id:'p17', category:'POLA · MATRIKS', prompt:'Simbol apa yang melengkapi matriks berikut?', visualGrid:['●','●●','●●●','▲','▲▲','▲▲▲','■','■■','?'], options:['■','■■','■■■','■■■■'], answer:2, explanation:'Setiap baris memakai satu bentuk yang sama dengan jumlah bertambah dari satu sampai tiga.' },
  { id:'p18', category:'POLA', prompt:'Lengkapi pasangan: 2A, 4C, 6E, 8G, …', options:['9H','10I','10J','12I'], answer:1, explanation:'Angka bertambah dua dan huruf maju dua posisi: A, C, E, G, I.' },
  { id:'p19', category:'POLA', prompt:'Urutan simbol: ◆, ○, ◆, ○, ◆, …', options:['◆','○','□','△'], answer:1, explanation:'Dua simbol bergantian, sehingga setelah belah ketupat muncul lingkaran.' },
  { id:'p20', category:'POLA', prompt:'Pola berulang: ●, ▲, ■, ●, ▲, ■, ●, ▲, …', options:['●','▲','■','◆'], answer:2, explanation:'Urutan tiga simbol berulang. Setelah lingkaran dan segitiga, berikutnya persegi.' },
  { id:'s17', category:'DERET', prompt:'Angka berikutnya: 3, 7, 15, 31, 63, …', options:['95','111','127','129'], answer:2, explanation:'Setiap angka dikalikan dua lalu ditambah satu: 63 × 2 + 1 = 127.' },
  { id:'s18', category:'DERET', prompt:'Angka berikutnya: 96, 48, 24, 12, …', options:['3','4','6','8'], answer:2, explanation:'Setiap angka dibagi dua, sehingga 12 ÷ 2 = 6.' },
  { id:'s19', category:'DERET', prompt:'Angka berikutnya: 1, 4, 10, 19, 31, …', options:['40','43','46','49'], answer:2, explanation:'Selisihnya +3, +6, +9, +12, lalu +15. Jadi 31 + 15 = 46.' },
  { id:'s20', category:'DERET', prompt:'Angka berikutnya: 2, 6, 12, 20, 30, …', options:['36','40','42','44'], answer:2, explanation:'Pola adalah n × (n + 1): 1×2, 2×3, 3×4, dan seterusnya; berikutnya 6×7 = 42.' },
  { id:'l17', category:'LOGIKA', prompt:'Semua arsitek membuat rancangan. Rina adalah arsitek. Kesimpulan yang pasti?', options:['Rina membuat rancangan','Rina mengajar arsitektur','Semua pembuat rancangan arsitek','Rina pemilik bangunan'], answer:0, explanation:'Rina termasuk kelompok arsitek, dan semua arsitek pada premis membuat rancangan.' },
  { id:'l18', category:'LOGIKA', prompt:'A duduk di sebelah kiri B. C duduk di sebelah kanan B. Siapa yang berada di tengah?', options:['A','B','C','Tidak dapat ditentukan'], answer:1, explanation:'Urutannya A – B – C, sehingga B berada di tengah.' },
  { id:'l19', category:'LOGIKA', prompt:'Semua P adalah Q. Sebagian Q adalah R. Apa yang pasti benar?', options:['Semua P adalah R','Sebagian P pasti R','Semua R adalah P','Semua P termasuk Q'], answer:3, explanation:'Premis pertama menjamin semua P termasuk Q. Tidak ada kepastian bahwa P beririsan dengan R.' },
  { id:'l20', category:'LOGIKA', prompt:'Jika alarm aktif, lampu indikator menyala. Lampu indikator menyala. Apa yang dapat dipastikan?', options:['Alarm pasti aktif','Alarm pasti mati','Alarm mungkin aktif, tetapi belum pasti','Listrik pasti padam'], answer:2, explanation:'Indikator menyala bisa disebabkan alarm atau kondisi lain; arah kebalikan implikasi tidak dapat dipastikan.' },
  { id:'m17', category:'HITUNG CEPAT', prompt:'18% dari 250 adalah…', options:['35','40','45','50'], answer:2, explanation:'10% dari 250 adalah 25 dan 8% adalah 20; total 45.' },
  { id:'m18', category:'HITUNG CEPAT', prompt:'144 ÷ 12 = …', options:['10','11','12','14'], answer:2, explanation:'12 × 12 = 144.' },
  { id:'m19', category:'HITUNG CEPAT', prompt:'Rata-rata dari 6, 8, 10, dan 12 adalah…', options:['8','9','10','11'], answer:1, explanation:'Jumlahnya 36. Dibagi empat menghasilkan 9.' },
  { id:'m20', category:'HITUNG CEPAT', prompt:'2,5 jam sama dengan…', options:['120 menit','135 menit','150 menit','180 menit'], answer:2, explanation:'2 jam = 120 menit dan 0,5 jam = 30 menit; total 150 menit.' },
  { id:'a17', category:'ANALOGI', prompt:'Termometer : suhu = timbangan : …', options:['tinggi','berat','jarak','waktu'], answer:1, explanation:'Termometer mengukur suhu, sedangkan timbangan mengukur berat.' },
  { id:'a18', category:'ANALOGI', prompt:'Pisau : memotong = jarum : …', options:['menjahit','mengukur','melukis','mengaduk'], answer:0, explanation:'Pisau digunakan untuk memotong, jarum digunakan untuk menjahit.' },
  { id:'a19', category:'ANALOGI', prompt:'Akar : pohon = fondasi : …', options:['jendela','bangunan','atap','pintu'], answer:1, explanation:'Akar menopang pohon, fondasi menopang bangunan.' },
  { id:'a20', category:'ANALOGI', prompt:'Kompas : arah = kalender : …', options:['cuaca','waktu/tanggal','jarak','kecepatan'], answer:1, explanation:'Kompas membantu mengetahui arah, kalender membantu mengetahui waktu dan tanggal.' }
];

function iqFamily(category) {
  const value = String(category || '').toUpperCase();
  if (value.startsWith('POLA')) return 'POLA';
  if (value.startsWith('DERET')) return 'DERET';
  if (value.startsWith('LOGIKA')) return 'LOGIKA';
  if (value.startsWith('HITUNG')) return 'HITUNG CEPAT';
  return 'ANALOGI';
}

export function selectIQQuestions(seed = createRandomSeed(), count = 12) {
  const total = Math.max(1, Math.min(Number(count) || 12, IQ_QUESTIONS.length));
  const families = ['POLA', 'DERET', 'LOGIKA', 'HITUNG CEPAT', 'ANALOGI'];
  const baseCount = Math.floor(total / families.length);
  let extra = total % families.length;
  const selected = [];
  families.forEach((family, index) => {
    const amount = baseCount + (extra-- > 0 ? 1 : 0);
    const questions = IQ_QUESTIONS.filter(question => iqFamily(question.category) === family);
    selected.push(...seededShuffle(questions, (Number(seed) + (index + 1) * 104729) >>> 0).slice(0, amount));
  });
  return seededShuffle(selected, (Number(seed) ^ 0x49514455) >>> 0).slice(0, total);
}

export function scoreIqAnswers(questionSet = [], answers = {}) {
  let correct = 0;
  const details = questionSet.map((question, index) => {
    const value = answers?.[index];
    const selected = Number.isInteger(value) ? value : null;
    const isCorrect = selected === question.answer;
    if (isCorrect) correct += 1;
    return { id: question.id, category: iqFamily(question.category), selected, answer: question.answer, isCorrect, explanation: question.explanation };
  });
  return { correct, total: questionSet.length, percentage: questionSet.length ? Math.round(correct / questionSet.length * 100) : 0, details };
}
