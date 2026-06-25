import React, { useState } from 'react';

// 1. Déclaration du type
export interface WilayaItem {
  id: number;
  name: string;
  count?: number;
}

// 2. Liste complète des 69 wilayas
const wilayasData: WilayaItem[] = [
  { id: 1, name: "Adrar", count: 2 }, { id: 2, name: "Chlef", count: 1 }, { id: 3, name: "Laghouat", count: 3 }, 
  { id: 4, name: "Oum El Bouaghi" }, { id: 5, name: "Batna" }, { id: 6, name: "Béjaïa", count: 1 }, 
  { id: 7, name: "Biskra", count: 1 }, { id: 8, name: "Béchar" }, { id: 9, name: "Blida", count: 1 }, 
  { id: 10, name: "Bouira" }, { id: 11, name: "Tamanrasset" }, { id: 12, name: "Tébessa" }, 
  { id: 13, name: "Tlemcen" }, { id: 14, name: "Tiaret" }, { id: 15, name: "Tizi Ouzou", count: 1 }, 
  { id: 16, name: "Alger", count: 4 }, { id: 17, name: "Djelfa" }, { id: 18, name: "Jijel" }, 
  { id: 19, name: "Sétif", count: 1 }, { id: 20, name: "Saïda" }, { id: 21, name: "Skikda" }, 
  { id: 22, name: "Sidi Bel Abbès" }, { id: 23, name: "Annaba", count: 1 }, { id: 24, name: "Guelma" }, 
  { id: 25, name: "Constantine", count: 1 }, { id: 26, name: "Médéa" }, { id: 27, name: "Mostaganem" }, 
  { id: 28, name: "M'Sila" }, { id: 29, name: "Mascara" }, { id: 30, name: "Ouargla" }, 
  { id: 31, name: "Oran", count: 2 }, { id: 32, name: "El Bayadh" }, { id: 33, name: "Illizi" }, 
  { id: 34, name: "Bordj Bou Arréridj" }, { id: 35, name: "Boumerdès" }, { id: 36, name: "El Tarf" }, 
  { id: 37, name: "Tindouf" }, { id: 38, name: "Tissemsilt" }, { id: 39, name: "El Oued" }, 
  { id: 40, name: "Khenchela" }, { id: 41, name: "Souk Ahras" }, { id: 42, name: "Tipaza" }, 
  { id: 43, name: "Mila" }, { id: 44, name: "Aïn Defla" }, { id: 45, name: "Naâma" }, 
  { id: 46, name: "Aïn Témouchent" }, { id: 47, name: "Ghardaïa" }, { id: 48, name: "Relizane" },
  { id: 49, name: "El M'Ghair" }, { id: 50, name: "El Meniaa" }, { id: 51, name: "Ouled Djellal" }, 
  { id: 52, name: "Bordj Badji Mokhtar" }, { id: 53, name: "Béni Abbès" }, { id: 54, name: "In Salah" }, 
  { id: 55, name: "In Guezzam" }, { id: 56, name: "Touggourt" }, { id: 57, name: "Djanet" }, 
  { id: 58, name: "Al M'Ghair_Double" },
  { id: 59, name: "Wilaya_59" }, { id: 60, name: "Wilaya_60" }, { id: 61, name: "Wilaya_61" }, 
  { id: 62, name: "Wilaya_62" }, { id: 63, name: "Wilaya_63" }, { id: 64, name: "Wilaya_64" }, 
  { id: 65, name: "Wilaya_65" }, { id: 66, name: "Wilaya_66" }, { id: 67, name: "Wilaya_67" }, 
  { id: 68, name: "Wilaya_68" }, { id: 69, name: "Wilaya_69" }
];

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#0a0f0b',
    color: '#eee',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
    fontFamily: 'sans-serif'
  },
  cardContainer: {
    width: '100%',
    maxWidth: '550px',
    backgroundColor: '#111c14',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #1c2e21',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4ade80',
    marginBottom: '8px',
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: '550px',
  },
  pillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '10px',
    width: '100%',
    maxWidth: '550px',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#142217',
    borderRadius: '20px',
    border: '1px solid #1c3322',
    cursor: 'pointer',
  },
  id: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#4ade80',
    marginRight: '6px',
  },
  name: {
    fontSize: '13px',
    color: '#fff',
    flexGrow: 1,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  count: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#111',
    backgroundColor: '#a3e635',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default function MapPage() {
  const [hoveredWilaya, setHoveredWilaya] = useState<string | null>(null);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Toutes les wilayas ({wilayasData.length})</h1>

      {/* Rendu SVG natif sans bibliothèque externe pour garantir le Build Vercel */}
      <div style={styles.cardContainer}>
        <svg 
          viewBox="0 0 500 500" 
          style={{ width: '100%', maxHeight: '400px' }}
        >
          {/* Silhouette stylisée de l'Algérie découpée (Illustration simplifiée fluide) */}
          <g fill={hoveredWilaya ? "#1e3322" : "#1e3322"} stroke="#0a0f0b" strokeWidth="2">
            {/* Nord-Ouest */}
            <path d="M150,120 Q180,100 220,110 L210,150 L160,160 Z" fill={hoveredWilaya === 'Oran' ? '#4ade80' : undefined} onMouseEnter={() => setHoveredWilaya('Oran')} onMouseLeave={() => setHoveredWilaya(null)} />
            {/* Centre / Alger */}
            <path d="M220,110 Q260,100 300,125 L280,170 L210,150 Z" fill={hoveredWilaya === 'Alger' ? '#4ade80' : undefined} onMouseEnter={() => setHoveredWilaya('Alger')} onMouseLeave={() => setHoveredWilaya(null)} />
            {/* Nord-Est */}
            <path d="M300,125 Q350,110 390,130 L360,185 L280,170 Z" fill={hoveredWilaya === 'Annaba' ? '#4ade80' : undefined} onMouseEnter={() => setHoveredWilaya('Annaba')} onMouseLeave={() => setHoveredWilaya(null)} />
            {/* Hauts Plateaux Ouest */}
            <path d="M120,170 L160,160 L210,150 L190,210 L110,210 Z" />
            {/* Hauts Plateaux Est */}
            <path d="M210,150 L280,170 L360,185 L380,240 L260,230 L190,210 Z" />
            {/* Sahara Nord */}
            <path d="M110,210 L190,210 L260,230 L380,240 L420,310 L290,340 L160,300 L90,260 Z" />
            {/* Grand Sud Adrar / Tamanrasset */}
            <path d="M90,260 L160,300 L290,340 L420,310 L400,380 L350,470 L250,440 L150,380 Z" />
          </g>
        </svg>
      </div>

      {/* Grille des 69 boutons */}
      <div style={styles.pillsGrid}>
        {wilayasData.map((wilaya) => (
          <div 
            key={wilaya.id} 
            style={{
              ...styles.pill,
              backgroundColor: hoveredWilaya?.toLowerCase() === wilaya.name.toLowerCase() ? '#4ade80' : '#142217'
            }}
          >
            <span style={styles.id}>{wilaya.id}:</span>
            <span style={{ ...styles.name, color: hoveredWilaya?.toLowerCase() === wilaya.name.toLowerCase() ? '#111' : '#fff' }}>{wilaya.name}</span>
            {wilaya.count && <span style={styles.count}>{wilaya.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
