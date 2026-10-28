"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { masterSchema, type MasterInput, type MasterKind, type MasterRecord } from "@/lib/domain";
import { masterApplicationFields, masterLabels } from "@/lib/masters";
import { repository } from "@/lib/repository";
import { useDemo } from "./demo-provider";
import { PageHeading } from "./page-heading";
import { Confirm, Empty, ErrorMessage, Field, Pagination, messageOf } from "./ui";

export function MasterData({ kind }: { kind: MasterKind }) {
  const { data, run } = useDemo();
  const [editing, setEditing] = useState<MasterRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<MasterRecord | null>(null);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [page, setPage] = useState(1);
  const label = masterLabels[kind];
  const rows = data![kind].filter((record) =>
    record.name.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID")) &&
    (!district || record.districtId === district),
  ).toSorted((a, b) => a.name.localeCompare(b.name, "id"));
  const safePage = Math.min(page, Math.max(1, Math.ceil(rows.length / 5)));
  return <>
    <PageHeading eyebrow="ADMINISTRASI" title={`Master ${label}`}
      description={kind === "villages"
        ? "Kelola kelurahan beserta kecamatannya untuk pilihan lokasi penelitian."
        : `Kelola pilihan ${label} pada formulir pengajuan penelitian.`}>
      <button className="button primary" onClick={() => setEditing("new")}>
        <Plus size={17} /> Tambah {label}
      </button>
    </PageHeading>
    <p className="subtle-note">Data awal adalah contoh sintetis. Tambahkan atau sesuaikan nama melalui menu ini sebelum digunakan.</p>
    {editing && <MasterForm key={typeof editing === "string" ? "new" : editing.id}
      kind={kind} item={typeof editing === "string" ? undefined : editing}
      close={() => setEditing(null)} />}
    <section className="card">
      <div className="table-toolbar">
        <div className="search-field"><Search size={18} />
          <input aria-label={`Cari ${label}`} placeholder={`Cari ${label}…`} value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        </div>
        {kind === "villages" && <select aria-label="Filter kecamatan" value={district}
          onChange={(e) => { setDistrict(e.target.value); setPage(1); }}>
          <option value="">Semua kecamatan</option>
          {data!.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>}
      </div>
      {rows.length ? <div className="table-scroll"><table>
        <thead><tr><th>Nama {label}</th>{kind === "villages" && <th>Kecamatan</th>}
          <th>Jumlah pengajuan</th><th className="align-right">Tindakan</th></tr></thead>
        <tbody>{rows.slice((safePage - 1) * 5, safePage * 5).map((record) => <tr key={record.id}>
          <td><strong>{record.name}</strong></td>
          {kind === "villages" && <td>{data!.districts.find((d) => d.id === record.districtId)?.name}</td>}
          <td>{data!.applications.filter((a) => a[masterApplicationFields[kind]] === record.id).length} pengajuan</td>
          <td><div className="table-actions">
            <button className="button secondary small" aria-label={`Edit ${record.name}`} onClick={() => setEditing(record)}><Pencil size={15} /> Edit</button>
            <button className="icon-button delete" aria-label={`Hapus ${record.name}`} onClick={() => setDeleting(record)}><Trash2 size={16} /></button>
          </div></td>
        </tr>)}</tbody>
      </table></div> : <Empty title={`${label === "OPD" ? label : label[0].toUpperCase() + label.slice(1)} tidak ditemukan`}
        description="Tambahkan data baru atau ubah pencarian Anda." />}
      <Pagination page={safePage} count={rows.length} setPage={setPage} />
    </section>
    {deleting && <Confirm title={`Hapus ${label}?`}
      description={`“${deleting.name}” hanya dapat dihapus jika tidak digunakan pengajuan${kind === "districts" ? " dan tidak memiliki kelurahan" : ""}.`}
      onClose={() => setDeleting(null)}
      onConfirm={() => run(() => repository.deleteMaster(kind, deleting.id), "Data master berhasil dihapus.")} />}
  </>;
}

function MasterForm({ kind, item, close }: { kind: MasterKind; item?: MasterRecord; close: () => void }) {
  const { data, run } = useDemo();
  const [error, setError] = useState("");
  const label = masterLabels[kind];
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } = useForm<MasterInput>({
    resolver: zodResolver(masterSchema),
    defaultValues: { name: item?.name ?? "", districtId: item?.districtId ?? "" },
  });
  const used = !!item && data!.applications.some((a) => a.villageId === item.id);
  return <form className="card admin-form" noValidate onSubmit={handleSubmit(async (values) => {
    setError("");
    if (kind === "villages" && !values.districtId) {
      setFieldError("districtId", { message: "Pilih kecamatan terlebih dahulu." });
      return;
    }
    try {
      await run(() => repository.saveMaster(kind, values, item?.id), "Data master berhasil disimpan.");
      close();
    } catch (e) { setError(messageOf(e)); }
  })}>
    <h2>{item ? "Edit" : "Tambah"} {label}</h2>
    <fieldset className="form-fieldset" disabled={isSubmitting}>
      <div className="form-grid">
        <Field id="master-name" label={`Nama ${label}`} required error={errors.name?.message}>
          <input id="master-name" autoFocus maxLength={150} aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        {kind === "villages" && <Field id="master-district" label="Kecamatan" required error={errors.districtId?.message}
          hint={used ? "Kecamatan tidak dapat dipindah selama kelurahan digunakan pengajuan." : !data!.districts.length ? "Tambahkan kecamatan melalui Master kecamatan terlebih dahulu." : undefined}>
          <select id="master-district" aria-invalid={!!errors.districtId} {...register("districtId")}>
            <option value="">Pilih kecamatan</option>
            {data!.districts.map((d) => <option key={d.id} value={d.id} disabled={used && d.id !== item?.districtId}>{d.name}</option>)}
          </select>
        </Field>}
      </div>
      <ErrorMessage message={error} />
      <div className="actions">
        <button className="button primary" disabled={isSubmitting}>{isSubmitting ? "Menyimpan…" : "Simpan"}</button>
        <button className="button secondary" type="button" onClick={close}>Batal</button>
      </div>
    </fieldset>
  </form>;
}
