// Lista local de localidades de Moçambique (e principais postos fronteiriços
// dos corredores) com coordenadas aproximadas. Serve para converter um ponto
// GPS na localidade mais próxima SEM chamadas externas (offline, alojamento
// partilhado). É aproximada de propósito — cobre cidades, vilas ao longo dos
// corredores logísticos (Beira, Maputo, Nacala, Tete) e fronteiras.

export type Locality = {
  name: string;
  lat: number;
  lng: number;
};

export const MOZAMBIQUE_LOCALITIES: Locality[] = [
  // --- Sul ---
  { name: 'Maputo', lat: -25.9655, lng: 32.5832 },
  { name: 'Matola', lat: -25.9622, lng: 32.4589 },
  { name: 'Boane', lat: -26.0417, lng: 32.3269 },
  { name: 'Marracuene', lat: -25.7383, lng: 32.6786 },
  { name: 'Manhiça', lat: -25.4028, lng: 32.8072 },
  { name: 'Xai-Xai', lat: -25.0519, lng: 33.6442 },
  { name: 'Chókwè', lat: -24.5286, lng: 32.9836 },
  { name: 'Macia', lat: -25.0264, lng: 33.0975 },
  { name: 'Chibuto', lat: -24.6864, lng: 33.5306 },
  { name: 'Inhambane', lat: -23.865, lng: 35.3833 },
  { name: 'Maxixe', lat: -23.8597, lng: 35.3472 },
  { name: 'Vilankulo', lat: -22.0125, lng: 35.3133 },
  { name: 'Massinga', lat: -23.3233, lng: 35.3667 },
  { name: 'Ressano Garcia (fronteira)', lat: -25.4419, lng: 31.9861 },
  { name: 'Ponta do Ouro (fronteira)', lat: -26.8461, lng: 32.8886 },
  { name: 'Goba (fronteira)', lat: -26.2072, lng: 32.115 },

  // --- Centro ---
  { name: 'Beira', lat: -19.8436, lng: 34.8389 },
  { name: 'Dondo', lat: -19.6094, lng: 34.7431 },
  { name: 'Nhamatanda', lat: -19.2925, lng: 34.2131 },
  { name: 'Gorongosa', lat: -18.6819, lng: 34.0722 },
  { name: 'Chimoio', lat: -19.1164, lng: 33.4833 },
  { name: 'Manica', lat: -18.9364, lng: 32.8756 },
  { name: 'Machipanda (fronteira)', lat: -18.9333, lng: 32.6667 },
  { name: 'Catandica', lat: -18.0658, lng: 33.1772 },
  { name: 'Gondola', lat: -19.1394, lng: 33.6997 },
  { name: 'Tete', lat: -16.1564, lng: 33.5867 },
  { name: 'Moatize', lat: -16.1042, lng: 33.7297 },
  { name: 'Changara', lat: -16.7833, lng: 33.2833 },
  { name: 'Zóbuè (fronteira)', lat: -15.6117, lng: 34.2439 },
  { name: 'Cuchamano (fronteira)', lat: -16.05, lng: 33.0167 },
  { name: 'Quelimane', lat: -17.8786, lng: 36.8883 },
  { name: 'Mocuba', lat: -16.8394, lng: 36.9861 },
  { name: 'Gurué', lat: -15.4636, lng: 36.9881 },
  { name: 'Milange (fronteira)', lat: -16.0928, lng: 35.7539 },
  { name: 'Caia', lat: -17.8256, lng: 35.3336 },

  // --- Norte ---
  { name: 'Nampula', lat: -15.1165, lng: 39.2666 },
  { name: 'Nacala', lat: -14.5428, lng: 40.6728 },
  { name: 'Angoche', lat: -16.2325, lng: 39.9089 },
  { name: 'Monapo', lat: -14.9756, lng: 40.3417 },
  { name: 'Ilha de Moçambique', lat: -15.0353, lng: 40.7325 },
  { name: 'Cuamba', lat: -14.8031, lng: 36.5372 },
  { name: 'Lichinga', lat: -13.3128, lng: 35.2406 },
  { name: 'Mandimba (fronteira)', lat: -14.3583, lng: 35.6558 },
  { name: 'Pemba', lat: -12.9741, lng: 40.5178 },
  { name: 'Montepuez', lat: -13.1256, lng: 38.9997 },
  { name: 'Mocímboa da Praia', lat: -11.3186, lng: 40.3536 },
  { name: 'Mueda', lat: -11.6742, lng: 39.5586 },
  { name: 'Negomano (fronteira)', lat: -11.4239, lng: 38.5167 },
];
