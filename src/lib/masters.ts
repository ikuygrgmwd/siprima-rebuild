import type { MasterData, MasterKind } from "./domain";

export const masterLabels: Record<MasterKind, string> = {
  opds: "OPD",
  districts: "kecamatan",
  villages: "kelurahan",
};
export const masterApplicationFields = {
  opds: "opdId",
  districts: "districtId",
  villages: "villageId",
} as const;

// Synthetic examples, editable through the master screens; not official area data.
export function seedMasters(): MasterData {
  return {
    opds: [
      { id: "opd-1", name: "Dinas A (contoh)" },
      { id: "opd-2", name: "Badan B (contoh)" },
    ],
    districts: [
      { id: "district-1", name: "Kecamatan A (contoh)" },
      { id: "district-2", name: "Kecamatan B (contoh)" },
    ],
    villages: [
      { id: "village-1", name: "Kelurahan A1 (contoh)", districtId: "district-1" },
      { id: "village-2", name: "Kelurahan A2 (contoh)", districtId: "district-1" },
      { id: "village-3", name: "Kelurahan B1 (contoh)", districtId: "district-2" },
    ],
  };
}
