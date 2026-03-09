// components/admin/tabs/LanguagesTab.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Globe } from "lucide-react";
import { useWoodizStore, Translation, DEFAULT_FR_STRINGS } from "@/lib/store";

const ALL_KEYS = Object.keys(DEFAULT_FR_STRINGS);

export default function LanguagesTab() {
  const { settings, translations, activeLocale, setLocale, saveTranslation, deleteTranslation } = useWoodizStore();
  const [editingLocale, setEditingLocale] = useState<string | null>(null);
  const [newLang, setNewLang] = useState({ locale: "", label: "", flag: "" });
  const [showNewForm, setShowNewForm] = useState(false);
  const [editStrings, setEditStrings] = useState<Record<string, string>>({});

  function startEdit(t: Translation) {
    setEditingLocale(t.locale);
    setEditStrings({ ...t.strings });
  }

  function cancelEdit() {
    setEditingLocale(null);
    setEditStrings({});
  }

  function saveEdit(locale: string) {
    const t = translations.find((t) => t.locale === locale);
    if (!t) return;
    saveTranslation({ ...t, strings: editStrings });
    setEditingLocale(null);
  }

  function addLanguage() {
    if (!newLang.locale || !newLang.label) return;
    // Copy FR strings as base
    const fr = translations.find((t) => t.locale === "fr");
    const strings = { ...(fr?.strings ?? DEFAULT_FR_STRINGS) };
    saveTranslation({ locale: newLang.locale, label: newLang.label, flag: newLang.flag || "🌐", strings });
    setNewLang({ locale: "", label: "", flag: "" });
    setShowNewForm(false);
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-2xl text-slate-800" style={{ fontFamily: "Poppins, sans-serif" }}>
            Langues & Traductions
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gérez les langues disponibles sur le site</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: settings.primaryColor }}
        >
          <Plus size={15} /> Ajouter une langue
        </button>
      </div>

      {/* Add language form */}
      {showNewForm && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
          <h2 className="font-bold text-slate-800 mb-4">Nouvelle langue</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="form-label">Code (ex: es, de, ar)</label>
              <input className="form-input" value={newLang.locale} onChange={(e) => setNewLang({ ...newLang, locale: e.target.value.toLowerCase() })} placeholder="es" />
            </div>
            <div>
              <label className="form-label">Nom (ex: Español)</label>
              <input className="form-input" value={newLang.label} onChange={(e) => setNewLang({ ...newLang, label: e.target.value })} placeholder="Español" />
            </div>
            <div>
              <label className="form-label">Drapeau emoji</label>
              <input className="form-input" value={newLang.flag} onChange={(e) => setNewLang({ ...newLang, flag: e.target.value })} placeholder="🇪🇸" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={addLanguage} className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: settings.primaryColor }}>
              Créer
            </button>
            <button onClick={() => setShowNewForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 bg-slate-100">
              Annuler
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">💡 La langue sera initialisée avec les textes français que vous pourrez ensuite traduire.</p>
        </div>
      )}

      {/* Language list */}
      <div className="flex flex-col gap-4">
        {translations.map((t) => {
          const isEditing = editingLocale === t.locale;
          const isActive = activeLocale === t.locale;
          return (
            <div key={t.locale} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isActive ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-100"}`}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.flag}</span>
                  <div>
                    <div className="font-bold text-slate-800">{t.label}</div>
                    <div className="text-xs text-slate-400 font-mono">{t.locale}</div>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      onClick={() => setLocale(t.locale)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Globe size={12} className="inline mr-1" />
                      Activer
                    </button>
                  )}
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(t.locale)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1">
                        <Check size={12} /> Sauvegarder
                      </button>
                      <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1">
                        <X size={12} /> Annuler
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(t)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1">
                      <Edit2 size={12} /> Modifier
                    </button>
                  )}
                  {t.locale !== "fr" && (
                    <button
                      onClick={() => deleteTranslation(t.locale)}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Translation strings */}
              {isEditing && (
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {ALL_KEYS.map((key) => {
                      const fr = translations.find((t) => t.locale === "fr");
                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">{key}</label>
                          <div className="text-xs text-slate-400 italic mb-0.5">{fr?.strings[key]}</div>
                          <input
                            className="form-input text-sm"
                            value={editStrings[key] ?? ""}
                            onChange={(e) => setEditStrings({ ...editStrings, [key]: e.target.value })}
                            placeholder={fr?.strings[key]}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="px-5 py-3 text-xs text-slate-400 flex items-center gap-4">
                  <span>{ALL_KEYS.length} chaînes de texte</span>
                  <span>·</span>
                  <span>{Object.values(t.strings).filter((v) => v).length} traduites</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
