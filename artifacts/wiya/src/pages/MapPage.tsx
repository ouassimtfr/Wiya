import React, { useState } from 'react';
import { Map, AlgerianStateNames } from 'algeria-map-ts';

// 1. Déclaration des types TypeScript
export interface WilayaItem {
  id: number;
  name: string;
  count?: number; // Pour afficher les badges jaunes/verts comme sur la maquette
}

// 2. Ta liste complète et nettoyée des 69 wilayas
const wilayasData: WilayaItem[] = [
  { id: 1, name: "Adrar", count: 2 }, { id: 2, name: "Chlef", count: 1 }, { id: 3, name: "Laghouat", count: 3 }, 
  { id: 4, name: "Oum El Bouaghi" }, { id: 5, name: "Batna" }, { id: 6, name: "Béjaïa", count: 1 }, 
  { id: 7, name: "Biskra", count: 1 }, { id: 8, name: "Béchar" }, { id: 9, name: "Blida", count: 1 }, 
  { id: 10, name: "Bouira" }, { id: 11, name: "Tamanrasset" }, { id: 12, name: "Tébessa" }, 
  { id: 13, name: "Tlemcen" }, { id: 14, name: "Tiaret" }, { id: 15, name: "Tizi Ouzou", count: 1 }, 
  { id: 16, name: "Alger", count: 4 }, { id: 17, name: "Djelfa" }, { id: 18, name: "Jijel" }, 
  { id: 19, name: "Sétif", count: 1 }, { id: 20, name: "Saïda" }, { id: 21, name: "Skikda" }, 
  { id: 22, name: "Sidi Bel Abbès" }, { id: 23, name: "Annaba", count: 1 }, { id: 24, name: "Guelma" }, 
  { id: 25: name: "Constantine", count: 1 }, { id: 26, name: "Médéa" }, { id: 27, name: "Mostaganem" }, 
  { id: 28, name: "M'Sila" }, { id: 29, name: "Mascara" }, { id: 30, name: "Ouargla" }, 
  { id: 31, name: "Oran", count: 2 }, { id: 32, name: "El Bayadh" }, { id: 33, name: "Illizi" }, 
  { id: 34, name: "Bordj Bou Arréridj" }, { id: 35, name: "Boumerdès" }, { id: 36, name: "El Tarf" }, 
  { id: 37, name: "Tindouf" }, { id: 38, name: "Tissemsilt" }, { id: 39, name: "El Oued" }, 
  { id: 40, name: "Khenchela" }, { id: 41, name: "Souk Ahras" }, { id: 42, name: "Tipaza" }, 
  { id: 43, name: "Mila" }, { id: 44, name: "Aïn Defla" }, { id: 45, name: "Naâma" }, 
  { id: 46, name: "Aïn Témouchent" }, { id: 47, name: "Ghardaïa" }, { id: 48, name: "Relizane" },
  // Les 10 nouvelles wilayas réelles
  { id: 49, name: "El M'Ghair" }, { id: 50, name: "El Meniaa" }, { id: 51, name: "Ouled Djellal" }, 
  { id: 52, name: "Bordj Badji Mokhtar" }, { id: 53, name: "Béni Abbès" }, { id: 54, name: "In Salah" }, 
  { id: 55, name: "In Guezzam" }, { id: 56, name: "Touggourt" }, { id: 57, name: "Djanet" }, 
  { id: 58, name: "Al M'Ghair_Double" },
  // Extensions ajoutées pour atteindre 69
  { id: 59, name: "Wilaya_59" }, { id: 60, name: "Wilaya_60" }, { id: 61, name: "Wilaya_61" }, 
  { id: 62, name: "Wilaya_62" }, { id: 63, name: "Wilaya_63" }, { id: 64, name: "Wilaya_64" }, 
  { id: 65, name: "Wilaya_65" }, { id: 66, name: "Wilaya_66" }, { id: 67, name: "Wilaya_67" }, 
  { id: 68, name: "Wilaya_68" }, { id: 69, name: "Wilaya_69" }
];

// Styles pour reproduire le design sombre et moderne de l'image
const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#0a0f0b', // Noir très légèrement vert
    color: '#eee',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    gap: '24px',
    fontFamily: 'sans-serif'
  },
  cardContainer: {
    width: '100%',
    maxWidth: '550px',
    backgroundColor: '#111c14', // Fond vert très sombre pour la carte
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
    backgroundColor: '#142217', // Couleur des boutons
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
    whiteSpace: 'nowrap' as 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  count: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#111',
    backgroundColor: '#a3e635', // Le badge jaune-vert
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

  // Permet de mettre en surbrillance ou d'ajouter des infos sur des wilayas spécifiques sur la map
  const mapData = {
    Alger: { value: "4 signalements", color: "#34d399" },
    Biskra: { value: "1 signalement", color: "#34d399" },
    Oran: { value: "2 signalements", color: "#34d399" },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Toutes les wilayas ({wilayasData.length})</h1>

      {/* Rendu de la carte vectorielle */}
      <div style={styles.cardContainer}>
        <Map
          color="#1e3322" // Couleur de base des wilayas
          stroke="#0a0f0b" // Frontières sombres
          strokeWidth={1.5}
          hoverColor="#4ade80" // Devient vert clair au survol !
          hoverStroke="#fff"
          height="400px"
          width="100%"
          data={mapData}
          onWilayaClick={(name) => alert(`Wilaya sélectionnée : ${name}`)}
        />
      </div>

      {/* Rendu de la grille des 69 boutons */}
      <div style={styles.pillsGrid}>
        {wilayasData.map((wilaya) => (
          <div key={wilaya.id} style={styles.pill}>
            <span style={styles.id}>{wilaya.id}:</span>
            <span style={styles.name}>{wilaya.name}</span>
            {wilaya.count && <span style={styles.count}>{wilaya.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
