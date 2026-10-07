// Seed Data for Kolasib District Village Councils & Emergency Services
// District: Kolasib, Mizoram, India

const initialVillages = [
  // Kolasib Town Area
  { id: 'v-diakkawn', name: 'Kolasib Diakkawn', category: 'Kolasib Town', totalMembers: 5, address: 'Diakkawn, Kolasib' },
  { id: 'v-venglai', name: 'Kolasib Venglai', category: 'Kolasib Town', totalMembers: 5, address: 'Venglai, Kolasib' },
  { id: 'v-electric', name: 'Kolasib Electric Veng', category: 'Kolasib Town', totalMembers: 5, address: 'Electric Veng, Kolasib' },
  { id: 'v-hmarveng', name: 'Kolasib Hmar Veng', category: 'Kolasib Town', totalMembers: 5, address: 'Hmar Veng, Kolasib' },
  { id: 'v-banglaveng', name: 'Kolasib Banglaveng', category: 'Kolasib Town', totalMembers: 5, address: 'Banglaveng, Kolasib' },
  { id: 'v-projectveng', name: 'Kolasib Project Veng', category: 'Kolasib Town', totalMembers: 5, address: 'Project Veng, Kolasib' },
  { id: 'v-tuithaveng', name: 'Kolasib Tuitha Veng', category: 'Kolasib Town', totalMembers: 5, address: 'Tuitha Veng, Kolasib' },
  { id: 'v-tumpui', name: 'Kolasib Tumpui', category: 'Kolasib Town', totalMembers: 5, address: 'Tumpui, Kolasib' },
  { id: 'v-vengthar', name: 'Kolasib Vengthar', category: 'Kolasib Town', totalMembers: 5, address: 'Vengthar, Kolasib' },
  { id: 'v-khuangpuilam', name: 'Kolasib Khuangpuilam', category: 'Kolasib Town', totalMembers: 5, address: 'Khuangpuilam, Kolasib' },
  { id: 'v-collegeveng', name: 'Kolasib College Veng', category: 'Kolasib Town', totalMembers: 5, address: 'College Veng, Kolasib' },
  { id: 'v-saidan', name: 'Kolasib Saidan', category: 'Kolasib Town', totalMembers: 5, address: 'Saidan, Kolasib' },
  { id: 'v-rengtekawn', name: 'Kolasib Rengtekawn', category: 'Kolasib Town', totalMembers: 5, address: 'Rengtekawn, Kolasib' },
  { id: 'v-gosenveng', name: 'Kolasib Gosen Veng', category: 'Kolasib Town', totalMembers: 5, address: 'Gosen Veng, Kolasib' },
  { id: 'v-hebron', name: 'Kolasib Hebron Veng', category: 'Kolasib Town', totalMembers: 5, address: 'Hebron Veng, Kolasib' },
  { id: 'v-salem', name: 'Kolasib Salem Veng', category: 'Kolasib Town', totalMembers: 5, address: 'Salem Veng, Kolasib' },

  // Vairengte Sub-Division
  { id: 'v-vairengte-1', name: 'Vairengte - I (Field Veng)', category: 'Vairengte Area', totalMembers: 5, address: 'Field Veng, Vairengte' },
  { id: 'v-vairengte-2', name: 'Vairengte - II (State Veng)', category: 'Vairengte Area', totalMembers: 5, address: 'State Veng, Vairengte' },
  { id: 'v-vairengte-3', name: 'Vairengte - III (IOC Veng)', category: 'Vairengte Area', totalMembers: 5, address: 'IOC Veng, Vairengte' },
  { id: 'v-vairengte-4', name: 'Vairengte - IV', category: 'Vairengte Area', totalMembers: 5, address: 'Vairengte' },
  { id: 'v-phainuam', name: 'Phainuam', category: 'Vairengte Area', totalMembers: 5, address: 'Phainuam Village' },
  { id: 'v-saipum', name: 'Saipum', category: 'Vairengte Area', totalMembers: 5, address: 'Saipum Village' },
  { id: 'v-saiphai', name: 'Saiphai', category: 'Vairengte Area', totalMembers: 5, address: 'Saiphai Village' },
  { id: 'v-saihapui-k', name: 'Saihapui K', category: 'Vairengte Area', totalMembers: 5, address: 'Saihapui K Village' },
  { id: 'v-chhimluang', name: 'North Chhimluang', category: 'Vairengte Area', totalMembers: 5, address: 'N. Chhimluang' },

  // Bilkhawthlir Block
  { id: 'v-bilkhawthlir-n', name: 'Bilkhawthlir North', category: 'Bilkhawthlir Area', totalMembers: 5, address: 'Bilkhawthlir North' },
  { id: 'v-bilkhawthlir-s', name: 'Bilkhawthlir South', category: 'Bilkhawthlir Area', totalMembers: 5, address: 'Bilkhawthlir South' },
  { id: 'v-buhchangphai', name: 'Buhchangphai', category: 'Bilkhawthlir Area', totalMembers: 5, address: 'Buhchangphai Village' },
  { id: 'v-bukvannei', name: 'Bukvannei', category: 'Bilkhawthlir Area', totalMembers: 5, address: 'Bukvannei Village' },
  { id: 'v-bukpui', name: 'Bukpui', category: 'Bilkhawthlir Area', totalMembers: 5, address: 'Bukpui Village' },
  { id: 'v-meidum', name: 'Meidum', category: 'Bilkhawthlir Area', totalMembers: 5, address: 'Meidum Village' },
  { id: 'v-thingthelh', name: 'Thingthelh', category: 'Bilkhawthlir Area', totalMembers: 5, address: 'Thingthelh Village' },
  { id: 'v-thinglian', name: 'North Thinglian', category: 'Bilkhawthlir Area', totalMembers: 5, address: 'N. Thinglian' },

  // Bairabi Area
  { id: 'v-bairabi-n', name: 'Bairabi North', category: 'Bairabi Area', totalMembers: 5, address: 'Bairabi North' },
  { id: 'v-bairabi-s', name: 'Bairabi South', category: 'Bairabi Area', totalMembers: 5, address: 'Bairabi South' },
  { id: 'v-bairabi-stn', name: 'Bairabi Station Veng', category: 'Bairabi Area', totalMembers: 5, address: 'Bairabi Station' },
  { id: 'v-phaisen', name: 'Phaisen', category: 'Bairabi Area', totalMembers: 5, address: 'Phaisen Village' },

  // Kawnpui Sub-Division
  { id: 'v-kawnpui-1', name: 'Kawnpui - I', category: 'Kawnpui Area', totalMembers: 5, address: 'Kawnpui I' },
  { id: 'v-kawnpui-2', name: 'Kawnpui - II', category: 'Kawnpui Area', totalMembers: 5, address: 'Kawnpui II' },
  { id: 'v-kawnpui-3', name: 'Kawnpui - III', category: 'Kawnpui Area', totalMembers: 5, address: 'Kawnpui III' },
  { id: 'v-kawnpui-venglai', name: 'Kawnpui Venglai', category: 'Kawnpui Area', totalMembers: 5, address: 'Kawnpui Venglai' },
  { id: 'v-bualpui-n', name: 'Bualpui North', category: 'Kawnpui Area', totalMembers: 5, address: 'Bualpui North' },
  { id: 'v-hortoki', name: 'Hortoki', category: 'Kawnpui Area', totalMembers: 5, address: 'Hortoki Village' },
  { id: 'v-lungdai', name: 'Lungdai', category: 'Kawnpui Area', totalMembers: 5, address: 'Lungdai Village' },
  { id: 'v-serkhan', name: 'Serkhan', category: 'Kawnpui Area', totalMembers: 5, address: 'Serkhan Village' },
  { id: 'v-zanlawn', name: 'Zanlawn', category: 'Kawnpui Area', totalMembers: 5, address: 'Zanlawn Village' },
  { id: 'v-pangbalkawn', name: 'Pangbalkawn', category: 'Kawnpui Area', totalMembers: 5, address: 'Pangbalkawn Village' },
  { id: 'v-sethawn', name: 'Sethawn', category: 'Kawnpui Area', totalMembers: 5, address: 'Sethawn Village' },

  // Thingdawl Block
  { id: 'v-thingdawl', name: 'Thingdawl', category: 'Thingdawl Area', totalMembers: 5, address: 'Thingdawl Village' },
  { id: 'v-nhlimen', name: 'North Hlimen', category: 'Thingdawl Area', totalMembers: 5, address: 'N. Hlimen Village' }
];

const initialContacts = [
  // Kolasib Diakkawn
  {
    id: 'c-101',
    villageId: 'v-diakkawn',
    villageName: 'Kolasib Diakkawn',
    category: 'Kolasib Town',
    name: 'Lalremruata Ralte',
    designation: 'President (VCP)',
    phone: '9862354120',
    altPhone: '9436152840',
    term: '2025-2030',
    notes: 'Office hours: 9:00 AM - 4:00 PM',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-102',
    villageId: 'v-diakkawn',
    villageName: 'Kolasib Diakkawn',
    category: 'Kolasib Town',
    name: 'C. Zohmingliana',
    designation: 'Vice President (VCVP)',
    phone: '9862894512',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-103',
    villageId: 'v-diakkawn',
    villageName: 'Kolasib Diakkawn',
    category: 'Kolasib Town',
    name: 'Vanlalhruaia Sailo',
    designation: 'Secretary (VCS)',
    phone: '9436367819',
    altPhone: '7005128943',
    term: '2025-2030',
    notes: 'Handles VC certificates and identity verification',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-104',
    villageId: 'v-diakkawn',
    villageName: 'Kolasib Diakkawn',
    category: 'Kolasib Town',
    name: 'Lalbiakdiki',
    designation: 'Member (VCM)',
    phone: '9612349012',
    altPhone: '',
    term: '2025-2030',
    notes: 'Women Reserved Seat',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-105',
    villageId: 'v-diakkawn',
    villageName: 'Kolasib Diakkawn',
    category: 'Kolasib Town',
    name: 'H. Lalmuanpuia',
    designation: 'Member (VCM)',
    phone: '9856123789',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Venglai
  {
    id: 'c-106',
    villageId: 'v-venglai',
    villageName: 'Kolasib Venglai',
    category: 'Kolasib Town',
    name: 'K. Lalthlamuana',
    designation: 'President (VCP)',
    phone: '9436151902',
    altPhone: '',
    term: '2025-2030',
    notes: 'VC Court Kolasib Venglai',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-107',
    villageId: 'v-venglai',
    villageName: 'Kolasib Venglai',
    category: 'Kolasib Town',
    name: 'Lalrinawma Khiangte',
    designation: 'Vice President (VCVP)',
    phone: '9862771034',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-108',
    villageId: 'v-venglai',
    villageName: 'Kolasib Venglai',
    category: 'Kolasib Town',
    name: 'R. Lalhmingmawii',
    designation: 'Secretary (VCS)',
    phone: '7005432198',
    altPhone: '9402167823',
    term: '2025-2030',
    notes: 'Public residential certificate issuer',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-109',
    villageId: 'v-venglai',
    villageName: 'Kolasib Venglai',
    category: 'Kolasib Town',
    name: 'Zonunmawia Pachuau',
    designation: 'Member (VCM)',
    phone: '9862098711',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-110',
    villageId: 'v-venglai',
    villageName: 'Kolasib Venglai',
    category: 'Kolasib Town',
    name: 'Lalchhandama',
    designation: 'Village Level Worker (VLW)',
    phone: '9612845601',
    altPhone: '',
    term: 'Permanent',
    notes: 'LAD liaison officer',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Electric Veng
  {
    id: 'c-111',
    villageId: 'v-electric',
    villageName: 'Kolasib Electric Veng',
    category: 'Kolasib Town',
    name: 'Laldawngliana',
    designation: 'President (VCP)',
    phone: '9862561928',
    altPhone: '',
    term: '2025-2030',
    notes: 'Near P&E Substation',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-112',
    villageId: 'v-electric',
    villageName: 'Kolasib Electric Veng',
    category: 'Kolasib Town',
    name: 'T. Vanlalruata',
    designation: 'Secretary (VCS)',
    phone: '9436371890',
    altPhone: '',
    term: '2025-2030',
    notes: 'Electric Veng Community Hall',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-113',
    villageId: 'v-electric',
    villageName: 'Kolasib Electric Veng',
    category: 'Kolasib Town',
    name: 'Malsawmtluanga Fanai',
    designation: 'Member (VCM)',
    phone: '9774321045',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Hmar Veng
  {
    id: 'c-114',
    villageId: 'v-hmarveng',
    villageName: 'Kolasib Hmar Veng',
    category: 'Kolasib Town',
    name: 'Lalramchhana',
    designation: 'President (VCP)',
    phone: '9862112456',
    altPhone: '',
    term: '2025-2030',
    notes: 'Hmar Veng Kolasib',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-115',
    villageId: 'v-hmarveng',
    villageName: 'Kolasib Hmar Veng',
    category: 'Kolasib Town',
    name: 'Lalthanzuala',
    designation: 'Secretary (VCS)',
    phone: '9436159981',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Banglaveng
  {
    id: 'c-116',
    villageId: 'v-banglaveng',
    villageName: 'Kolasib Banglaveng',
    category: 'Kolasib Town',
    name: 'C. Lalmuankima',
    designation: 'President (VCP)',
    phone: '9862890123',
    altPhone: '',
    term: '2025-2030',
    notes: 'Near DC Bungalow road',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-117',
    villageId: 'v-banglaveng',
    villageName: 'Kolasib Banglaveng',
    category: 'Kolasib Town',
    name: 'Lalfakzuala Tochhawng',
    designation: 'Secretary (VCS)',
    phone: '7005118742',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Project Veng
  {
    id: 'c-118',
    villageId: 'v-projectveng',
    villageName: 'Kolasib Project Veng',
    category: 'Kolasib Town',
    name: 'Lalrindika Chhangte',
    designation: 'President (VCP)',
    phone: '9436389201',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-119',
    villageId: 'v-projectveng',
    villageName: 'Kolasib Project Veng',
    category: 'Kolasib Town',
    name: 'VL Hmangaihsanga',
    designation: 'Secretary (VCS)',
    phone: '9862309874',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Tuitha Veng
  {
    id: 'c-120',
    villageId: 'v-tuithaveng',
    villageName: 'Kolasib Tuitha Veng',
    category: 'Kolasib Town',
    name: 'Lalthanzama',
    designation: 'President (VCP)',
    phone: '9862419087',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-121',
    villageId: 'v-tuithaveng',
    villageName: 'Kolasib Tuitha Veng',
    category: 'Kolasib Town',
    name: 'Lalrohlua',
    designation: 'Secretary (VCS)',
    phone: '9436157834',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Tumpui
  {
    id: 'c-122',
    villageId: 'v-tumpui',
    villageName: 'Kolasib Tumpui',
    category: 'Kolasib Town',
    name: 'R. Lalnunmawia',
    designation: 'President (VCP)',
    phone: '9862781203',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-123',
    villageId: 'v-tumpui',
    villageName: 'Kolasib Tumpui',
    category: 'Kolasib Town',
    name: 'Lalramenga',
    designation: 'Secretary (VCS)',
    phone: '7005992145',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Vengthar
  {
    id: 'c-124',
    villageId: 'v-vengthar',
    villageName: 'Kolasib Vengthar',
    category: 'Kolasib Town',
    name: 'Zothanmawia',
    designation: 'President (VCP)',
    phone: '9862198032',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-125',
    villageId: 'v-vengthar',
    villageName: 'Kolasib Vengthar',
    category: 'Kolasib Town',
    name: 'Lallawmsanga',
    designation: 'Secretary (VCS)',
    phone: '9436154321',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Khuangpuilam
  {
    id: 'c-126',
    villageId: 'v-khuangpuilam',
    villageName: 'Kolasib Khuangpuilam',
    category: 'Kolasib Town',
    name: 'Lalhmunsiama',
    designation: 'President (VCP)',
    phone: '9862314567',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-127',
    villageId: 'v-khuangpuilam',
    villageName: 'Kolasib Khuangpuilam',
    category: 'Kolasib Town',
    name: 'Vanlalsawma',
    designation: 'Secretary (VCS)',
    phone: '7005781290',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib College Veng
  {
    id: 'c-128',
    villageId: 'v-collegeveng',
    villageName: 'Kolasib College Veng',
    category: 'Kolasib Town',
    name: 'Lalhmangaiha',
    designation: 'President (VCP)',
    phone: '9862551423',
    altPhone: '',
    term: '2025-2030',
    notes: 'Kolasib College Road',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-129',
    villageId: 'v-collegeveng',
    villageName: 'Kolasib College Veng',
    category: 'Kolasib Town',
    name: 'C. Lalmuanpuia',
    designation: 'Secretary (VCS)',
    phone: '9436387654',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Saidan
  {
    id: 'c-130',
    villageId: 'v-saidan',
    villageName: 'Kolasib Saidan',
    category: 'Kolasib Town',
    name: 'Lalremsanga',
    designation: 'President (VCP)',
    phone: '9862776512',
    altPhone: '',
    term: '2025-2030',
    notes: 'Near Saidan Tourist Lodge',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-131',
    villageId: 'v-saidan',
    villageName: 'Kolasib Saidan',
    category: 'Kolasib Town',
    name: 'Vanlalruata',
    designation: 'Secretary (VCS)',
    phone: '9612398412',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kolasib Rengtekawn
  {
    id: 'c-132',
    villageId: 'v-rengtekawn',
    villageName: 'Kolasib Rengtekawn',
    category: 'Kolasib Town',
    name: 'Lalbiakkima',
    designation: 'President (VCP)',
    phone: '9862991045',
    altPhone: '',
    term: '2025-2030',
    notes: 'Junction point towards Bairabi',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-133',
    villageId: 'v-rengtekawn',
    villageName: 'Kolasib Rengtekawn',
    category: 'Kolasib Town',
    name: 'T. Lalrinmawia',
    designation: 'Secretary (VCS)',
    phone: '9436192837',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Vairengte - I (Field Veng)
  {
    id: 'c-201',
    villageId: 'v-vairengte-1',
    villageName: 'Vairengte - I (Field Veng)',
    category: 'Vairengte Area',
    name: 'Lalthanpuia Royte',
    designation: 'President (VCP)',
    phone: '9436150291',
    altPhone: '',
    term: '2025-2030',
    notes: 'Vairengte border town',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-202',
    villageId: 'v-vairengte-1',
    villageName: 'Vairengte - I (Field Veng)',
    category: 'Vairengte Area',
    name: 'C. Lalhmachhuana',
    designation: 'Secretary (VCS)',
    phone: '9862341908',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-203',
    villageId: 'v-vairengte-1',
    villageName: 'Vairengte - I (Field Veng)',
    category: 'Vairengte Area',
    name: 'Zoramthanga',
    designation: 'Member (VCM)',
    phone: '9612089456',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Vairengte - II (State Veng)
  {
    id: 'c-204',
    villageId: 'v-vairengte-2',
    villageName: 'Vairengte - II (State Veng)',
    category: 'Vairengte Area',
    name: 'K. Lalnuntluanga',
    designation: 'President (VCP)',
    phone: '9862789123',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-205',
    villageId: 'v-vairengte-2',
    villageName: 'Vairengte - II (State Veng)',
    category: 'Vairengte Area',
    name: 'Lalramenga Hmar',
    designation: 'Secretary (VCS)',
    phone: '7005123987',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Bilkhawthlir North
  {
    id: 'c-301',
    villageId: 'v-bilkhawthlir-n',
    villageName: 'Bilkhawthlir North',
    category: 'Bilkhawthlir Area',
    name: 'Lalawmpuia',
    designation: 'President (VCP)',
    phone: '9436158721',
    altPhone: '',
    term: '2025-2030',
    notes: 'Bilkhawthlir Block HQ',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-302',
    villageId: 'v-bilkhawthlir-n',
    villageName: 'Bilkhawthlir North',
    category: 'Bilkhawthlir Area',
    name: 'R. Lalbiaktluanga',
    designation: 'Secretary (VCS)',
    phone: '9862451290',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-303',
    villageId: 'v-bilkhawthlir-n',
    villageName: 'Bilkhawthlir North',
    category: 'Bilkhawthlir Area',
    name: 'Lalchawimawii',
    designation: 'Member (VCM)',
    phone: '9612784512',
    altPhone: '',
    term: '2025-2030',
    notes: 'Women Reserved Seat',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Bilkhawthlir South
  {
    id: 'c-304',
    villageId: 'v-bilkhawthlir-s',
    villageName: 'Bilkhawthlir South',
    category: 'Bilkhawthlir Area',
    name: 'Zothankhuma',
    designation: 'President (VCP)',
    phone: '9862124578',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-305',
    villageId: 'v-bilkhawthlir-s',
    villageName: 'Bilkhawthlir South',
    category: 'Bilkhawthlir Area',
    name: 'Lalhmangaihzuala',
    designation: 'Secretary (VCS)',
    phone: '9436389012',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Bairabi North
  {
    id: 'c-401',
    villageId: 'v-bairabi-n',
    villageName: 'Bairabi North',
    category: 'Bairabi Area',
    name: 'Lalrosanga',
    designation: 'President (VCP)',
    phone: '9436156543',
    altPhone: '',
    term: '2025-2030',
    notes: 'Railway Station border area',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-402',
    villageId: 'v-bairabi-n',
    villageName: 'Bairabi North',
    category: 'Bairabi Area',
    name: 'PC Lalmuansanga',
    designation: 'Secretary (VCS)',
    phone: '9862908712',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Bairabi South
  {
    id: 'c-403',
    villageId: 'v-bairabi-s',
    villageName: 'Bairabi South',
    category: 'Bairabi Area',
    name: 'C. Lalropuia',
    designation: 'President (VCP)',
    phone: '9862456712',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-404',
    villageId: 'v-bairabi-s',
    villageName: 'Bairabi South',
    category: 'Bairabi Area',
    name: 'Lalrammawia Sailo',
    designation: 'Secretary (VCS)',
    phone: '7005876543',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kawnpui - I
  {
    id: 'c-501',
    villageId: 'v-kawnpui-1',
    villageName: 'Kawnpui - I',
    category: 'Kawnpui Area',
    name: 'Lalchhuana',
    designation: 'President (VCP)',
    phone: '9436159812',
    altPhone: '',
    term: '2025-2030',
    notes: 'NH-306 Corridor',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-502',
    villageId: 'v-kawnpui-1',
    villageName: 'Kawnpui - I',
    category: 'Kawnpui Area',
    name: 'K. Lalthafala',
    designation: 'Secretary (VCS)',
    phone: '9862123984',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Kawnpui - II
  {
    id: 'c-503',
    villageId: 'v-kawnpui-2',
    villageName: 'Kawnpui - II',
    category: 'Kawnpui Area',
    name: 'Lalrinawma Ralte',
    designation: 'President (VCP)',
    phone: '9862890451',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-504',
    villageId: 'v-kawnpui-2',
    villageName: 'Kawnpui - II',
    category: 'Kawnpui Area',
    name: 'H. Vanlalmuana',
    designation: 'Secretary (VCS)',
    phone: '7005439812',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Thingdawl
  {
    id: 'c-601',
    villageId: 'v-thingdawl',
    villageName: 'Thingdawl',
    category: 'Thingdawl Area',
    name: 'Lalnunfela',
    designation: 'President (VCP)',
    phone: '9436152345',
    altPhone: '',
    term: '2025-2030',
    notes: 'Near Thingdawl KVK',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-602',
    villageId: 'v-thingdawl',
    villageName: 'Thingdawl',
    category: 'Thingdawl Area',
    name: 'Lalthanmawia',
    designation: 'Secretary (VCS)',
    phone: '9862459012',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Saiphai
  {
    id: 'c-701',
    villageId: 'v-saiphai',
    villageName: 'Saiphai',
    category: 'Vairengte Area',
    name: 'Lalnunmawia Fanai',
    designation: 'President (VCP)',
    phone: '9436154567',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-702',
    villageId: 'v-saiphai',
    villageName: 'Saiphai',
    category: 'Vairengte Area',
    name: 'Zonuntluanga',
    designation: 'Secretary (VCS)',
    phone: '9862348901',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },

  // Hortoki
  {
    id: 'c-801',
    villageId: 'v-hortoki',
    villageName: 'Hortoki',
    category: 'Kawnpui Area',
    name: 'Lalawmpuia Chawngthu',
    designation: 'President (VCP)',
    phone: '9862891234',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'c-802',
    villageId: 'v-hortoki',
    villageName: 'Hortoki',
    category: 'Kawnpui Area',
    name: 'C. Lalramliana',
    designation: 'Secretary (VCS)',
    phone: '9436381290',
    altPhone: '',
    term: '2025-2030',
    notes: '',
    updatedAt: '2026-10-01T10:00:00.000Z'
  }
];

const initialEmergency = [
  {
    id: 'em-1',
    service: 'DC Office Kolasib',
    category: 'Administration',
    officer: 'Deputy Commissioner, Kolasib',
    phone: '03837220002',
    altPhone: '03837220003',
    address: 'DC Office Complex, Kolasib',
    priority: 1
  },
  {
    id: 'em-2',
    service: 'SP Office Kolasib',
    category: 'Police & Security',
    officer: 'Superintendent of Police',
    phone: '03837220023',
    altPhone: '03837220024',
    address: 'SP Office, Kolasib',
    priority: 1
  },
  {
    id: 'em-3',
    service: 'Kolasib Police Station',
    category: 'Police & Security',
    officer: 'Officer-in-Charge (OC)',
    phone: '03837220025',
    altPhone: '112',
    address: 'Diakkawn, Kolasib',
    priority: 1
  },
  {
    id: 'em-4',
    service: 'Fire & Emergency Services',
    category: 'Fire & Rescue',
    officer: 'Station Officer, Kolasib',
    phone: '03837220101',
    altPhone: '101',
    address: 'Fire Station, Project Veng, Kolasib',
    priority: 1
  },
  {
    id: 'em-5',
    service: 'District Hospital Kolasib',
    category: 'Health & Medical',
    officer: 'Medical Superintendent / Casualty',
    phone: '03837220038',
    altPhone: '03837220042',
    address: 'Hospital Veng, Kolasib',
    priority: 1
  },
  {
    id: 'em-6',
    service: '108 Ambulance Service',
    category: 'Health & Medical',
    officer: 'Emergency Medical Response Service',
    phone: '108',
    altPhone: '102',
    address: 'District Hospital Campus, Kolasib',
    priority: 1
  },
  {
    id: 'em-7',
    service: 'Disaster Management (DDMA)',
    category: 'Disaster & Relief',
    officer: 'Disaster Control Room Kolasib',
    phone: '1077',
    altPhone: '03837221088',
    address: 'DC Office, Kolasib',
    priority: 1
  },
  {
    id: 'em-8',
    service: 'Power & Electricity (P&E)',
    category: 'Utilities',
    officer: 'P&E Sub-Division Kolasib',
    phone: '03837220015',
    altPhone: '9436150000',
    address: 'Electric Veng, Kolasib',
    priority: 2
  },
  {
    id: 'em-9',
    service: 'PHE Water Supply Kolasib',
    category: 'Utilities',
    officer: 'Executive Engineer / SDO PHE',
    phone: '03837220018',
    altPhone: '',
    address: 'PHE Complex, Kolasib',
    priority: 2
  },
  {
    id: 'em-10',
    service: 'Vairengte Police Station',
    category: 'Police & Security',
    officer: 'Officer-in-Charge, Vairengte PS',
    phone: '03837262224',
    altPhone: '112',
    address: 'Vairengte Town',
    priority: 2
  },
  {
    id: 'em-11',
    service: 'Bairabi Police Station',
    category: 'Police & Security',
    officer: 'Officer-in-Charge, Bairabi PS',
    phone: '03837275225',
    altPhone: '112',
    address: 'Bairabi Town',
    priority: 2
  },
  {
    id: 'em-12',
    service: 'Bilkhawthlir CHC',
    category: 'Health & Medical',
    officer: 'Medical Officer In-Charge',
    phone: '03837265220',
    altPhone: '',
    address: 'Bilkhawthlir',
    priority: 2
  },
  {
    id: 'em-13',
    service: 'Childline Kolasib',
    category: 'Helpline',
    officer: 'Child Helpline 24x7',
    phone: '1098',
    altPhone: '',
    address: 'Kolasib',
    priority: 2
  },
  {
    id: 'em-14',
    service: 'Women Helpline Mizoram',
    category: 'Helpline',
    officer: 'Women in Distress Helpline',
    phone: '181',
    altPhone: '',
    address: 'District Cell, Kolasib',
    priority: 2
  }
];

const initialOffices = [
  {
    id: 'off-dc',
    name: "Deputy Commissioner's Office (DC Office)",
    department: 'District Administration',
    category: 'Administration',
    address: 'DC Office Complex, Project Veng, Kolasib - 796081',
    phone: '03837220002',
    email: 'dckolasib@mizoram.gov.in',
    staff: [
      { id: 'stf-dc-1', name: 'Pu Robert C. Lalhmangaiha, IAS', designation: 'Deputy Commissioner (DC)', phone: '9862345678', altPhone: '03837220002', email: 'dc-kolasib@nic.in' },
      { id: 'stf-dc-2', name: 'Pi Lalrinchhani, MCS', designation: 'Addl. Deputy Commissioner (ADC)', phone: '9436141234', altPhone: '', email: 'adc.kolasib@gmail.com' },
      { id: 'stf-dc-3', name: 'Pu Lalthlamuana, MCS', designation: 'Sub-Divisional Officer (SDO Sadar)', phone: '9436152345', altPhone: '', email: 'sdosadar.klb@gmail.com' },
      { id: 'stf-dc-4', name: 'Pu C. Lalhminghlua, MCS', designation: 'Election Officer / DUDO', phone: '9612345678', altPhone: '', email: 'eo.kolasib@gmail.com' }
    ]
  },
  {
    id: 'off-sp',
    name: "Superintendent of Police Office (SP Office)",
    department: 'Police & Security',
    category: 'Police & Security',
    address: 'SP Office Complex, Diakkawn, Kolasib - 796081',
    phone: '03837220023',
    email: 'sp-kolasib@mizoram.gov.in',
    staff: [
      { id: 'stf-sp-1', name: 'Pu Stephen Lalrinawma, MPS', designation: 'Superintendent of Police (SP)', phone: '9436140023', altPhone: '03837220023', email: 'sp-kolasib@police.mizoram.gov.in' },
      { id: 'stf-sp-2', name: 'Pu Zorammuana, MPS', designation: 'Additional SP', phone: '9436150024', altPhone: '', email: 'addlsp.klb@police.mizoram.gov.in' },
      { id: 'stf-sp-3', name: 'Pu Lalbiakzuala, MPS', designation: 'Sub-Divisional Police Officer (SDPO)', phone: '9862123456', altPhone: '', email: 'sdpo.klb@gmail.com' },
      { id: 'stf-sp-4', name: 'Pu C. Vanlalruata', designation: 'Officer-in-Charge (OC Kolasib PS)', phone: '9436159876', altPhone: '03837220044', email: 'ockolasibps@gmail.com' }
    ]
  },
  {
    id: 'off-bdo-bil',
    name: 'Block Development Office (BDO Office), Bilkhawthlir',
    department: 'Rural Development',
    category: 'Development & Blocks',
    address: 'BDO Office, Bilkhawthlir, Kolasib District',
    phone: '03837262234',
    email: 'bdo.bilkhawthlir@mizoram.gov.in',
    staff: [
      { id: 'stf-bdo-1', name: 'Pu Lalmuanpuia, MCS', designation: 'Block Development Officer (BDO)', phone: '9436145678', altPhone: '', email: 'bdobilkhawthlir@gmail.com' },
      { id: 'stf-bdo-2', name: 'Pi Jenny Lalramnghaki', designation: 'Assistant Development Officer (ADO)', phone: '9862567890', altPhone: '', email: 'ado.bilkhawthlir@gmail.com' },
      { id: 'stf-bdo-3', name: 'Pu K. Vanlaldika', designation: 'Junior Engineer (MGNREGS)', phone: '9436345678', altPhone: '', email: 'je.mgnregs.klb@gmail.com' }
    ]
  },
  {
    id: 'off-cmo',
    name: 'Chief Medical Officer (CMO Office), Kolasib',
    department: 'Health & Family Welfare',
    category: 'Health',
    address: 'District Hospital Campus, Hospital Veng, Kolasib',
    phone: '03837220038',
    email: 'cmo.kolasib@mizoram.gov.in',
    staff: [
      { id: 'stf-cmo-1', name: 'Dr. R. Lalnuntluanga', designation: 'Chief Medical Officer (CMO)', phone: '9436149900', altPhone: '03837220038', email: 'cmokolasib@gmail.com' },
      { id: 'stf-cmo-2', name: 'Dr. Zonunmawia', designation: 'Medical Superintendent (MS Hospital)', phone: '9862112233', altPhone: '', email: 'mskolasib@gmail.com' },
      { id: 'stf-cmo-3', name: 'Pi Lalbiakveli', designation: 'District Programme Manager (NHM)', phone: '9436178822', altPhone: '', email: 'dpmkolasib@gmail.com' }
    ]
  },
  {
    id: 'off-pwd',
    name: 'Public Works Department (PWD), Kolasib Division',
    department: 'Public Works',
    category: 'Technical & Works',
    address: 'Executive Engineer PWD, Venglai, Kolasib',
    phone: '03837220045',
    email: 'ee.pwd.kolasib@mizoram.gov.in',
    staff: [
      { id: 'stf-pwd-1', name: 'Er. Lalchhandama', designation: 'Executive Engineer (EE PWD)', phone: '9436143322', altPhone: '', email: 'eepwdkolasib@gmail.com' },
      { id: 'stf-pwd-2', name: 'Er. Vanlalruata', designation: 'SDO PWD Highway Sub-Division', phone: '9436156677', altPhone: '', email: 'sdopwdklb@gmail.com' }
    ]
  },
  {
    id: 'off-phe',
    name: 'Public Health Engineering (PHE) Division, Kolasib',
    department: 'Water & Sanitation',
    category: 'Technical & Works',
    address: 'PHE Complex, Hmar Veng, Kolasib',
    phone: '03837220067',
    email: 'ee.phe.kolasib@mizoram.gov.in',
    staff: [
      { id: 'stf-phe-1', name: 'Er. C. Lalrammawia', designation: 'Executive Engineer (EE PHE)', phone: '9436148899', altPhone: '', email: 'eephekolasib@gmail.com' },
      { id: 'stf-phe-2', name: 'Er. Lalrinzuala', designation: 'SDO PHE Kolasib Sub-Division', phone: '9436157788', altPhone: '', email: 'sdopheklb@gmail.com' }
    ]
  },
  {
    id: 'off-power',
    name: 'Power & Electricity Department (P&E), Kolasib Division',
    department: 'Power & Energy',
    category: 'Utilities & Power',
    address: 'P&E Division Office, Electric Veng, Kolasib',
    phone: '03837220012',
    email: 'ee.power.kolasib@mizoram.gov.in',
    staff: [
      { id: 'stf-pwr-1', name: 'Er. Lalbiakthanga', designation: 'Executive Engineer (EE Power)', phone: '9436142211', altPhone: '', email: 'eepowerkolasib@gmail.com' },
      { id: 'stf-pwr-2', name: 'Er. H. Zothansanga', designation: 'SDO Electrical Sub-Division', phone: '9436153344', altPhone: '', email: 'sdopowerklb@gmail.com' }
    ]
  },
  {
    id: 'off-dao',
    name: 'District Agriculture Office (DAO), Kolasib',
    department: 'Agriculture & Farmers Welfare',
    category: 'Agriculture & Rural',
    district: 'Kolasib',
    address: 'DAO Office, Banglaveng, Kolasib',
    phone: '03837220089',
    email: 'dao.kolasib@mizoram.gov.in',
    staff: [
      { id: 'stf-dao-1', name: 'Pu Lalrinliana', designation: 'District Agriculture Officer (DAO)', phone: '9436147766', altPhone: '', email: 'daokolasib@gmail.com' },
      { id: 'stf-dao-2', name: 'Pi K. Lalduhawmi', designation: 'Sub-Divisional Agriculture Officer', phone: '9862778899', altPhone: '', email: 'sdaoklb@gmail.com' }
    ]
  }
];

const initialDistricts = [
  { id: 'dist-kolasib', name: 'Kolasib', code: 'KLB', headquarter: 'Kolasib', state: 'Mizoram', totalVCs: 60 },
  { id: 'dist-aizawl', name: 'Aizawl', code: 'AZL', headquarter: 'Aizawl', state: 'Mizoram', totalVCs: 85 },
  { id: 'dist-lunglei', name: 'Lunglei', code: 'LGL', headquarter: 'Lunglei', state: 'Mizoram', totalVCs: 72 },
  { id: 'dist-champhai', name: 'Champhai', code: 'CMP', headquarter: 'Champhai', state: 'Mizoram', totalVCs: 48 },
  { id: 'dist-mamit', name: 'Mamit', code: 'MMT', headquarter: 'Mamit', state: 'Mizoram', totalVCs: 52 },
  { id: 'dist-serchhip', name: 'Serchhip', code: 'SCP', headquarter: 'Serchhip', state: 'Mizoram', totalVCs: 38 },
  { id: 'dist-saitual', name: 'Saitual', code: 'STL', headquarter: 'Saitual', state: 'Mizoram', totalVCs: 32 },
  { id: 'dist-khawzawl', name: 'Khawzawl', code: 'KZL', headquarter: 'Khawzawl', state: 'Mizoram', totalVCs: 28 },
  { id: 'dist-hnahthial', name: 'Hnahthial', code: 'HNT', headquarter: 'Hnahthial', state: 'Mizoram', totalVCs: 26 },
  { id: 'dist-lawngtlai', name: 'Lawngtlai', code: 'LWT', headquarter: 'Lawngtlai', state: 'Mizoram', totalVCs: 55 },
  { id: 'dist-siaha', name: 'Siaha', code: 'SIH', headquarter: 'Siaha', state: 'Mizoram', totalVCs: 42 }
];

const additionalMultiDistrictData = {
  villages: [
    // Aizawl Local Councils / Villages
    { id: 'v-azl-khatla', name: 'Aizawl Khatla', category: 'Aizawl City', district: 'Aizawl', totalMembers: 5, address: 'Khatla, Aizawl' },
    { id: 'v-azl-chanmari', name: 'Aizawl Chanmari', category: 'Aizawl City', district: 'Aizawl', totalMembers: 5, address: 'Chanmari, Aizawl' },
    { id: 'v-azl-dawrpui', name: 'Aizawl Dawrpui', category: 'Aizawl City', district: 'Aizawl', totalMembers: 5, address: 'Dawrpui, Aizawl' },
    { id: 'v-azl-missionveng', name: 'Aizawl Mission Veng', category: 'Aizawl City', district: 'Aizawl', totalMembers: 5, address: 'Mission Veng, Aizawl' },
    { id: 'v-azl-ramhlun', name: 'Aizawl Ramhlun North', category: 'Aizawl City', district: 'Aizawl', totalMembers: 5, address: 'Ramhlun North, Aizawl' },
    { id: 'v-azl-bawngkawn', name: 'Aizawl Bawngkawn', category: 'Aizawl City', district: 'Aizawl', totalMembers: 5, address: 'Bawngkawn, Aizawl' },
    { id: 'v-azl-durtlang', name: 'Aizawl Durtlang', category: 'Aizawl North', district: 'Aizawl', totalMembers: 5, address: 'Durtlang, Aizawl' },
    { id: 'v-azl-sairang', name: 'Sairang VC', category: 'Aizawl Sub-Urban', district: 'Aizawl', totalMembers: 5, address: 'Sairang' },

    // Lunglei Villages
    { id: 'v-lgl-venglai', name: 'Lunglei Venglai', category: 'Lunglei Town', district: 'Lunglei', totalMembers: 5, address: 'Venglai, Lunglei' },
    { id: 'v-lgl-bazar', name: 'Lunglei Bazar Veng', category: 'Lunglei Town', district: 'Lunglei', totalMembers: 5, address: 'Bazar Veng, Lunglei' },
    { id: 'v-lgl-chanmari', name: 'Lunglei Chanmari', category: 'Lunglei Town', district: 'Lunglei', totalMembers: 5, address: 'Chanmari, Lunglei' },
    { id: 'v-lgl-rahsiveng', name: 'Lunglei Rahsiveng', category: 'Lunglei Town', district: 'Lunglei', totalMembers: 5, address: 'Rahsiveng, Lunglei' },

    // Champhai Villages
    { id: 'v-cmp-vengthlang', name: 'Champhai Vengthlang', category: 'Champhai Town', district: 'Champhai', totalMembers: 5, address: 'Vengthlang, Champhai' },
    { id: 'v-cmp-kahrawt', name: 'Champhai Kahrawt', category: 'Champhai Town', district: 'Champhai', totalMembers: 5, address: 'Kahrawt, Champhai' },
    { id: 'v-cmp-vengsang', name: 'Champhai Vengsang', category: 'Champhai Town', district: 'Champhai', totalMembers: 5, address: 'Vengsang, Champhai' }
  ],

  contacts: [
    // Aizawl Contacts
    { id: 'c-azl-1', name: 'Pu Lalthansanga', designation: 'Chairman (Local Council)', phone: '9436140111', altPhone: '', villageId: 'v-azl-khatla', villageName: 'Aizawl Khatla', category: 'Aizawl City', district: 'Aizawl', term: '2025-2030', notes: 'LC Chairman' },
    { id: 'c-azl-2', name: 'Pu C. Lalhmingliana', designation: 'Secretary (Local Council)', phone: '9436150222', altPhone: '', villageId: 'v-azl-khatla', villageName: 'Aizawl Khatla', category: 'Aizawl City', district: 'Aizawl', term: '2025-2030', notes: 'LC Secretary' },
    { id: 'c-azl-3', name: 'Pi R. Vanlalduhi', designation: 'Chairman (Local Council)', phone: '9862140333', altPhone: '', villageId: 'v-azl-chanmari', villageName: 'Aizawl Chanmari', category: 'Aizawl City', district: 'Aizawl', term: '2025-2030', notes: 'LC Chairman' },
    { id: 'c-azl-4', name: 'Pu Lalbiakkima', designation: 'Secretary (Local Council)', phone: '9436150444', altPhone: '', villageId: 'v-azl-chanmari', villageName: 'Aizawl Chanmari', category: 'Aizawl City', district: 'Aizawl', term: '2025-2030', notes: 'LC Secretary' },
    { id: 'c-azl-5', name: 'Pu H. Zorema', designation: 'Chairman (Local Council)', phone: '9436140555', altPhone: '', villageId: 'v-azl-dawrpui', villageName: 'Aizawl Dawrpui', category: 'Aizawl City', district: 'Aizawl', term: '2025-2030', notes: 'Commercial Center LC' },
    { id: 'c-azl-6', name: 'Pu Lalrinawma', designation: 'Chairman (Local Council)', phone: '9436140666', altPhone: '', villageId: 'v-azl-missionveng', villageName: 'Aizawl Mission Veng', category: 'Aizawl City', district: 'Aizawl', term: '2025-2030', notes: 'LC Chairman' },
    { id: 'c-azl-7', name: 'Pu K. Vanlalruata', designation: 'Chairman (Local Council)', phone: '9436140777', altPhone: '', villageId: 'v-azl-ramhlun', villageName: 'Aizawl Ramhlun North', category: 'Aizawl City', district: 'Aizawl', term: '2025-2030', notes: 'LC Chairman' },
    { id: 'c-azl-8', name: 'Pu Lalnuntluanga', designation: 'Chairman (Local Council)', phone: '9436140888', altPhone: '', villageId: 'v-azl-bawngkawn', villageName: 'Aizawl Bawngkawn', category: 'Aizawl City', district: 'Aizawl', term: '2025-2030', notes: 'Bawngkawn Junction LC' },

    // Lunglei Contacts
    { id: 'c-lgl-1', name: 'Pu Laldingliana', designation: 'President (VCP)', phone: '9436160111', altPhone: '', villageId: 'v-lgl-venglai', villageName: 'Lunglei Venglai', category: 'Lunglei Town', district: 'Lunglei', term: '2025-2030', notes: 'VCP Lunglei Venglai' },
    { id: 'c-lgl-2', name: 'Pu C. Lalrintluanga', designation: 'Secretary (VCS)', phone: '9436160222', altPhone: '', villageId: 'v-lgl-venglai', villageName: 'Lunglei Venglai', category: 'Lunglei Town', district: 'Lunglei', term: '2025-2030', notes: 'VCS Lunglei Venglai' },
    { id: 'c-lgl-3', name: 'Pu R. Lalbiaksanga', designation: 'President (VCP)', phone: '9436160333', altPhone: '', villageId: 'v-lgl-bazar', villageName: 'Lunglei Bazar Veng', category: 'Lunglei Town', district: 'Lunglei', term: '2025-2030', notes: 'Bazar Area VCP' },
    { id: 'c-lgl-4', name: 'Pu K. Lalthafala', designation: 'President (VCP)', phone: '9436160444', altPhone: '', villageId: 'v-lgl-chanmari', villageName: 'Lunglei Chanmari', category: 'Lunglei Town', district: 'Lunglei', term: '2025-2030', notes: 'Chanmari VCP' },

    // Champhai Contacts
    { id: 'c-cmp-1', name: 'Pu Lalchhandama', designation: 'President (VCP)', phone: '9436170111', altPhone: '', villageId: 'v-cmp-vengthlang', villageName: 'Champhai Vengthlang', category: 'Champhai Town', district: 'Champhai', term: '2025-2030', notes: 'Champhai VCP' },
    { id: 'c-cmp-2', name: 'Pu Vanlalruata', designation: 'President (VCP)', phone: '9436170222', altPhone: '', villageId: 'v-cmp-kahrawt', villageName: 'Champhai Kahrawt', category: 'Champhai Town', district: 'Champhai', term: '2025-2030', notes: 'Kahrawt VCP' }
  ],

  offices: [
    // Aizawl Offices
    {
      id: 'off-azl-dc',
      name: "Deputy Commissioner's Office (DC Office), Aizawl",
      department: 'District Administration',
      category: 'Administration',
      district: 'Aizawl',
      address: 'Treasury Square, Aizawl - 796001',
      phone: '03892322232',
      email: 'dc-aizawl@mizoram.gov.in',
      staff: [
        { id: 'stf-azl-dc-1', name: 'Dr. Lalzirmawia Chhangte, IAS', designation: 'Deputy Commissioner (DC)', phone: '9436140999', altPhone: '03892322232', email: 'dcaizawl@nic.in' },
        { id: 'stf-azl-dc-2', name: 'Pi Elizabeth Laldinmawii, MCS', designation: 'Addl. Deputy Commissioner (ADC)', phone: '9436151000', altPhone: '', email: 'adc.aizawl@gmail.com' }
      ]
    },
    {
      id: 'off-azl-sp',
      name: 'Superintendent of Police Office (SP Office), Aizawl',
      department: 'Police & Security',
      category: 'Police & Security',
      district: 'Aizawl',
      address: 'Khatla, Aizawl - 796001',
      phone: '03892322233',
      email: 'sp-aizawl@police.mizoram.gov.in',
      staff: [
        { id: 'stf-azl-sp-1', name: 'Pu Rahul Alwal, IPS', designation: 'Superintendent of Police (SP)', phone: '9436141111', altPhone: '03892322233', email: 'sp-aizawl@mizoram.gov.in' }
      ]
    },
    {
      id: 'off-azl-amc',
      name: 'Aizawl Municipal Corporation (AMC)',
      department: 'Urban Development',
      category: 'Administration',
      district: 'Aizawl',
      address: 'Thuampui, Aizawl',
      phone: '03892350222',
      email: 'commissioner.amc@mizoram.gov.in',
      staff: [
        { id: 'stf-azl-amc-1', name: 'Pu Lalhmingmawia, MCS', designation: 'Commissioner, AMC', phone: '9436142222', altPhone: '', email: 'commissioner@amc.gov.in' }
      ]
    },

    // Lunglei Offices
    {
      id: 'off-lgl-dc',
      name: "Deputy Commissioner's Office (DC Office), Lunglei",
      department: 'District Administration',
      category: 'Administration',
      district: 'Lunglei',
      address: 'Court Samtlang, Lunglei - 796701',
      phone: '03722324222',
      email: 'dc-lunglei@mizoram.gov.in',
      staff: [
        { id: 'stf-lgl-dc-1', name: 'Pu Ramdinliani, IAS', designation: 'Deputy Commissioner (DC)', phone: '9436160555', altPhone: '03722324222', email: 'dclunglei@nic.in' }
      ]
    },
    {
      id: 'off-lgl-sp',
      name: 'Superintendent of Police Office (SP Office), Lunglei',
      department: 'Police & Security',
      category: 'Police & Security',
      district: 'Lunglei',
      address: 'Venglai, Lunglei - 796701',
      phone: '03722324233',
      email: 'sp-lunglei@police.mizoram.gov.in',
      staff: [
        { id: 'stf-lgl-sp-1', name: 'Pu Rex Zarzoliana, MPS', designation: 'Superintendent of Police (SP)', phone: '9436160666', altPhone: '03722324233', email: 'splunglei@gmail.com' }
      ]
    },

    // Champhai Offices
    {
      id: 'off-cmp-dc',
      name: "Deputy Commissioner's Office (DC Office), Champhai",
      department: 'District Administration',
      category: 'Administration',
      district: 'Champhai',
      address: 'Keilungliah, Champhai - 796321',
      phone: '03831235222',
      email: 'dc-champhai@mizoram.gov.in',
      staff: [
        { id: 'stf-cmp-dc-1', name: 'Pu James Lalrinchhana, MCS', designation: 'Deputy Commissioner (DC)', phone: '9436170444', altPhone: '', email: 'dcchamphai@nic.in' }
      ]
    }
  ],

  emergency: [
    // Aizawl Emergency
    { id: 'em-azl-1', service: 'Police Control Room Aizawl', category: 'Police & Security', district: 'Aizawl', officer: 'Control Room In-Charge', phone: '03892322233', altPhone: '112', address: 'Khatla, Aizawl', priority: 1 },
    { id: 'em-azl-2', service: 'Civil Hospital Aizawl (Casualty)', category: 'Health & Medical', district: 'Aizawl', officer: 'Casualty Medical Officer', phone: '03892322318', altPhone: '108', address: 'Dawrpui, Aizawl', priority: 1 },
    { id: 'em-azl-3', service: 'Fire & Emergency Services HQ Aizawl', category: 'Fire & Rescue', district: 'Aizawl', officer: 'Fire Control Room', phone: '03892322049', altPhone: '101', address: 'Hunthar, Aizawl', priority: 1 },

    // Lunglei Emergency
    { id: 'em-lgl-1', service: 'Police Control Room Lunglei', category: 'Police & Security', district: 'Lunglei', officer: 'Duty Officer', phone: '03722324233', altPhone: '112', address: 'Venglai, Lunglei', priority: 1 },
    { id: 'em-lgl-2', service: 'Civil Hospital Lunglei', category: 'Health & Medical', district: 'Lunglei', officer: 'Casualty / Emergency', phone: '03722324038', altPhone: '108', address: 'Hospital Road, Lunglei', priority: 1 },
    { id: 'em-lgl-3', service: 'Fire Station Lunglei', category: 'Fire & Rescue', district: 'Lunglei', officer: 'Station Officer', phone: '03722324101', altPhone: '101', address: 'Bazar Veng, Lunglei', priority: 1 },

    // Champhai Emergency
    { id: 'em-cmp-1', service: 'Police Station Champhai', category: 'Police & Security', district: 'Champhai', officer: 'Officer-in-Charge', phone: '03831235233', altPhone: '112', address: 'Champhai Police Station', priority: 1 },
    { id: 'em-cmp-2', service: 'District Hospital Champhai', category: 'Health & Medical', district: 'Champhai', officer: 'Casualty Ward', phone: '03831235038', altPhone: '108', address: 'Kahrawt, Champhai', priority: 1 }
  ]
};

module.exports = {
  initialVillages,
  initialContacts,
  initialEmergency,
  initialOffices,
  initialDistricts,
  additionalMultiDistrictData
};


