import React, { useState } from 'react';

export interface WilayaItem {
  id: number;
  name: string;
  count?: number;
}

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
    transition: 'background-color 0.2s',
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
  },
  iframe: {
    width: '100%',
    height: '420px',
    border: 'none',
    borderRadius: '8px',
  }
};

export default function MapPage() {
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Toutes les wilayas ({wilayasData.length})</h1>

      {/* Intégration d'une carte vectorielle OpenSource propre et fluide */}
      <div style={styles.cardContainer}>
        <iframe 
          src="https://bndong.github.io/algeria-maps/" 
          style={styles.iframe}
          title="Carte d'Algérie"
        />
      </div>

      <div style={styles.pillsGrid}>
        {wilayasData.map((wilaya) => (
          <div 
            key={wilaya.id} 
            style={styles.pill}
            onClick={() => setActiveWilaya(wilaya.name)}
          >
            <span style={styles.id}>{wilaya.id}:</span>
            <span style={styles.name}>{wilaya.name}</span>
            {wilaya.count && <span style={styles.count}>{wilaya.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
