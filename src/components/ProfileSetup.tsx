"use client";

import { useEffect, useState } from "react";
import { Check, PencilLine } from "lucide-react";

const roles = [
  { value: "", label: "Роль не важна" },
  { value: "CARRY", label: "Керри" },
  { value: "MID", label: "Мидер" },
  { value: "OFFLANE", label: "Оффлейнер" },
  { value: "SOFT_SUPPORT", label: "Саппорт 4" },
  { value: "HARD_SUPPORT", label: "Саппорт 5" },
];

export default function ProfileSetup({
  player,
  onSaved,
}: {
  player: { id: string; nickname: string; realName: string | null; bio: string | null; mainRole: string | null };
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [realName, setRealName] = useState(player.realName ?? "");
  const [mainRole, setMainRole] = useState(player.mainRole ?? "");
  const [bio, setBio] = useState(player.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setRealName(player.realName ?? "");
    setMainRole(player.mainRole ?? "");
    setBio(player.bio ?? "");
  }, [player]);

  const complete = Boolean(player.mainRole || player.bio || player.realName);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/players/${player.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realName, mainRole, bio }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Не удалось обновить профиль");
      setMessage("Сохранено");
      setOpen(false);
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="data-label">Твой профиль</p><p className="mt-1 text-sm font-semibold text-graphite">{complete ? "Профиль уже живой" : "Добавь пару деталей о себе"}</p><p className="mt-1 text-xs leading-5 text-graphite-muted">Роль поможет команде понять, кого звать в игру. Остальное — по желанию.</p></div><button onClick={() => setOpen((value) => !value)} className="button-secondary"><PencilLine className="mr-1.5" size={14} />{open ? "Закрыть" : "Заполнить"}</button></div>
      {open && <div className="mt-5 grid gap-4 border-t border-hairline pt-5 sm:grid-cols-2"><div><label className="data-label mb-2 block" htmlFor="profile-name">Как тебя зовут</label><input id="profile-name" value={realName} onChange={(event) => setRealName(event.target.value)} placeholder="Необязательно" className="app-input" /></div><div><label className="data-label mb-2 block" htmlFor="profile-role">Основная роль</label><select id="profile-role" value={mainRole} onChange={(event) => setMainRole(event.target.value)} className="app-input"><option value="">Роль не важна</option>{roles.slice(1).map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></div><div className="sm:col-span-2"><label className="data-label mb-2 block" htmlFor="profile-bio">Коротко о себе</label><input id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Например: играю вечером, люблю саппортить и не горю" className="app-input" /></div><div className="sm:col-span-2 flex flex-wrap items-center gap-3"><button onClick={save} disabled={saving} className="button-primary">{saving ? "Сохраняем..." : "Сохранить профиль"}</button>{message && <p className={`flex items-center gap-1 text-xs font-medium ${message === "Сохранено" ? "text-accent-success" : "text-accent-danger"}`}>{message === "Сохранено" && <Check size={13} strokeWidth={2} />}{message}</p>}</div></div>}
    </section>
  );
}
