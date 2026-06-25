import React, { useState, useEffect } from 'react';

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
  { id: 58, name: "Al M'Ghair" },
  { id: 59, name: "Wilaya_59" }, { id: 60, name: "Wilaya_60" }, { id: 61, name: "Wilaya_61" }, 
  { id: 62, name: "Wilaya_62" }, { id: 63, name: "Wilaya_63" }, { id: 64, name: "Wilaya_64" }, 
  { id: 65, name: "Wilaya_65" }, { id: 66, name: "Wilaya_66" }, { id: 67, name: "Wilaya_67" }, 
  { id: 68, name: "Wilaya_68" }, { id: 69, name: "Wilaya_69" }
];

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#0a0f0b',
    color: '#eee',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '20px',
    fontFamily: 'sans-serif'
  },
  cardContainer: {
    width: '100%',
    maxWidth: '550px',
    backgroundColor: '#111c14',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #1c2e21',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '350px'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4ade80',
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: '550px',
    marginTop: '10px'
  },
  pillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    width: '100%',
    maxWidth: '550px',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: '#142217',
    borderRadius: '12px',
    border: '1px solid #1c3322',
    cursor: 'pointer',
  },
  id: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#4ade80',
    marginRight: '6px',
  },
  name: {
    fontSize: '13px',
    color: '#fff',
    flexGrow: 1,
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
  loading: {
    color: '#4ade80',
    fontSize: '14px'
  }
};

export default function MapPage() {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [hoveredWilaya, setHoveredWilaya] = useState<string | null>(null);

  // Récupération d'un GeoJSON propre des frontières de l'Algérie
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/bndong/algeria-maps/master/data/algeria-provinces.geojson')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error("Erreur chargement carte:", err));
  }, []);

  // Fonction simple pour convertir les coordonnées géographiques en pixels SVG (Projection Mercator simplifiée)
  const project = (coord: [number, number]) => {
    const lon = coord[0];
    const lat = coord[1];
    // Centré et zoomé pour la boîte englobante de l'Algérie
    const x =
