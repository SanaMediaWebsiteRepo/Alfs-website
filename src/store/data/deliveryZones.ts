/**
 * SAMPLE DELIVERY ZONES & FEES
 * -------------------------------------------------------------
 * Note: These zones and fees are made-up demonstration placeholders.
 * They will be replaced by real geographical zones, courier rates,
 * and logistics parameters provided by ALFS management.
 * -------------------------------------------------------------
 */

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  isPickup?: boolean;
  description?: string;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  // Commercial Dispatch Zones
  { id: 'lusaka-central', name: 'Lusaka Central', fee: 150, description: 'Direct courier to Lusaka urban & industrial sites' },
  { id: 'lusaka-outskirts', name: 'Lusaka Outskirts', fee: 250, description: 'Chilanga, Kafue Road, Chongwe & outer zones' },
  { id: 'copperbelt', name: 'Copperbelt (Kitwe, Ndola, Chingola)', fee: 350, description: 'Rapid dispatch to Copperbelt mining corridors' },
  { id: 'southern-prov', name: 'Southern Province', fee: 450, description: 'Mazabuka, Choma, Livingstone regional logistics' },
  { id: 'eastern-prov', name: 'Eastern Province', fee: 500, description: 'Petauke, Chipata & eastern agricultural hubs' },
  { id: 'northern-luapula', name: 'Northern and Luapula', fee: 600, description: 'Kasama, Mansa, Mpika & northern routes' },
  { id: 'western-northwestern', name: 'Western and North-Western', fee: 650, description: 'Solwezi, Kalumbila, Mongu & mining regions' },

  // Free Depot Collection Options
  { id: 'pickup-lusaka', name: 'Collect from Lusaka office', fee: 0, isPickup: true, description: 'Free collection from ALFS Lusaka Hub' },
  { id: 'pickup-chingola', name: 'Collect from Chingola office', fee: 0, isPickup: true, description: 'Free collection from ALFS Chingola Depot' },
];
