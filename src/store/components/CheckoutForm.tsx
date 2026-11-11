import React from 'react';
import { DELIVERY_ZONES, DeliveryZone } from '../data/deliveryZones';
import { formatKwacha } from '../lib/format';

interface CheckoutFormProps {
  fullName: string;
  setFullName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  selectedZoneId: string;
  setSelectedZoneId: (v: string) => void;
  selectedZone: DeliveryZone | undefined;
  address: string;
  setAddress: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  errors: Record<string, string>;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  fullName,
  setFullName,
  phone,
  setPhone,
  email,
  setEmail,
  company,
  setCompany,
  selectedZoneId,
  setSelectedZoneId,
  selectedZone,
  address,
  setAddress,
  notes,
  setNotes,
  errors,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
      <h2 className="text-lg font-black text-[#1a2e4a] pb-3 border-b border-slate-200">
        Customer &amp; Delivery Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:border-[#1a2e4a] focus:outline-none"
            placeholder="e.g. Mwansa Banda"
          />
          {errors.fullName && <p className="text-[10px] text-[#C0392B] mt-0.5">{errors.fullName}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:border-[#1a2e4a] focus:outline-none"
            placeholder="e.g. 0962334797"
          />
          {errors.phone && <p className="text-[10px] text-[#C0392B] mt-0.5">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:border-[#1a2e4a] focus:outline-none"
            placeholder="name@company.com"
          />
          {errors.email && <p className="text-[10px] text-[#C0392B] mt-0.5">{errors.email}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Company Name (Optional)</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:border-[#1a2e4a] focus:outline-none"
            placeholder="e.g. Copper Mining Ltd"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">Delivery / Collection Option *</label>
        <select
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(e.target.value)}
          className="w-full text-xs p-2.5 border border-slate-300 rounded bg-white focus:border-[#1a2e4a] focus:outline-none cursor-pointer"
        >
          {DELIVERY_ZONES.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name} — {zone.fee === 0 ? 'FREE Depot Pickup' : formatKwacha(zone.fee)}
            </option>
          ))}
        </select>
        {selectedZone?.description && <p className="text-[11px] text-slate-500 mt-1">{selectedZone.description}</p>}
      </div>

      {!selectedZone?.isPickup && (
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Physical Delivery Address *</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:border-[#1a2e4a] focus:outline-none"
            placeholder="Street, Plot number, Area or Mine Gate details..."
          />
          {errors.address && <p className="text-[10px] text-[#C0392B] mt-0.5">{errors.address}</p>}
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">Order Notes (Optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-xs p-2.5 border border-slate-300 rounded focus:border-[#1a2e4a] focus:outline-none"
          placeholder="Special delivery instructions or gate pass requirements"
        />
      </div>
    </div>
  );
};
