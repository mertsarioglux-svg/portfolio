import type { Text } from '../i18n/lang';

/*
 * Sitedeki kişisel bilgilerin hepsi burada.
 * Projeler src/content/projects/ klasöründe (her dil için ayrı dosya).
 */

export const site = {
  firstName: 'Mert',
  lastName: 'Sarıoğlu',

  meta: {
    description: {
      tr: 'Malatya Turgut Özal Üniversitesi’nde Yazılım Mühendisliği öğrencisi. Yapay zekâ ile ilgileniyor, ürünler geliştiriyorum.',
      en: 'Software Engineering student at Malatya Turgut Özal University. I work with AI and build products.',
    } satisfies Text,
  },

  // Giriş ekranının sol üstündeki iki satır
  intro: {
    tr: ['Yapay zekâ ile ilgileniyor,', 'ürünler geliştiriyorum.'],
    en: ['I work with AI and', 'build products.'],
  },

  // Giriş ekranının sağ üstündeki iki satır
  education: {
    tr: ['Yazılım Mühendisliği öğrencisi @', 'Malatya Turgut Özal Üniversitesi'],
    en: ['Software Engineering student @', 'Malatya Turgut Özal University'],
  },

  email: 'mertsarioglux@gmail.com',

  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mert-sarioglu/', color: '#0b22f4' },
    { label: 'GitHub', href: 'https://github.com/mertsarioglux-svg', color: '#8250df' },
    { label: 'X', href: 'https://x.com/MertSarioglu_', color: '#000000' },
  ],

  // Yaka kartının üstünde yazanlar. text: etiket yazısının rengi (açık zeminlerde koyu yazı için)
  badge: {
    current: {
      tr: 'Yazılım Mühendisliği @ Malatya Turgut Özal Üniversitesi',
      en: 'Software Engineering @ Malatya Turgut Özal University',
    } satisfies Text,
    tags: [
      { label: 'AI', color: '#6d28d9', text: '#ffffff' },
      { label: 'Python', color: '#ffd43b', text: '#1f2328' },
      { label: 'TypeScript', color: '#3178c6', text: '#ffffff' },
      { label: 'React', color: '#61dafb', text: '#0b1b24' },
    ],
  },

  // Ana sayfada projelerin altında ve "Hakkımda" panelinde görünür
  certificates: [
    {
      issuer: 'HackerRank',
      name: 'Python (Basic)',
      date: { tr: 'Mayıs 2026', en: 'May 2026' },
      year: '2026',
      topics: {
        tr: 'Skaler tipler, operatörler ve akış kontrolü, string’ler, koleksiyonlar ve iterasyon, modülerlik, nesneler, tipler ve sınıflar',
        en: 'Scalar types, operators and control flow, strings, collections and iteration, modularity, objects, types and classes',
      },
      url: 'https://www.hackerrank.com/certificates/8d3271050d08',
    },
  ] satisfies { issuer: string; name: string; date: Text; year: string; topics: Text; url: string }[],

  // "[daha fazla]" ile açılan panel
  about: {
    bio: {
      tr: [
        'Merhaba, ben Mert. Malatya Turgut Özal Üniversitesi’nde Yazılım Mühendisliği okuyorum. Yapay zekâ destekli uygulamalar geliştiriyorum; büyük dil modellerini ürünlere entegre etmeye ve geliştirme sürecinde AI araçlarını verimli kullanmaya odaklanıyorum.',
        'Son projelerimde Gemini ile çalışan bir mobilya asistanı, kumaş simülasyonlu bir 3D mağaza ve QR tabanlı bir sadakat uygulaması geliştirdim.',
      ],
      en: [
        'Hi, I’m Mert. I study Software Engineering at Malatya Turgut Özal University. I build AI-powered applications, focusing on integrating large language models into products and using AI tools effectively throughout development.',
        'Recently I built a furniture assistant powered by Gemini, a 3D store with cloth-simulated garments and a QR-based loyalty app.',
      ],
    },
    // TODO: kendi fotoğrafın (public/about/ klasörüne koy ve yolu güncelle)
    portrait: {
      src: '/about/portrait.svg',
      alt: { tr: 'Mert Sarıoğlu’nun fotoğrafı', en: 'Photo of Mert Sarıoğlu' } satisfies Text,
    },
  },

  footer: {
    heading: {
      tr: ['Birlikte güzel bir şey', 'inşa edelim'],
      en: ['Let’s build something', 'people care about'],
    },
  },
};
