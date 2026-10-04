import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Camera, X, Loader2, Briefcase } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { WILAYAS_DATA } from "@/lib/wilayas";

const JOB_TYPES = ["CDI", "CDD", "Stage", "Freelance", "Temps partiel", "Alternance"];

const JOB_SECTORS = [
  "Informatique",
  "Commerce et vente",
  "Restauration et hôtellerie",
  "Bâtiment et travaux",
  "Santé",
  "Éducation et formation",
  "Transport et logistique",
  "Administration et comptabilité",
  "Industrie",
  "Marketing et communication",
  "Autre",
];

const WILAYA_OPTIONS = WILAYAS_DATA.slice().sort((a, b) => a.code - b.code);

export default function PostListingPage() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const { user, createListing } = useStore();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [city, setCity] = useState("");
  const [condition, setCondition] = useState<"new" | "used">("used");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [jobKind, setJobKind] = useState<"offer" | "seeking">("offer");
  const [jobType, setJobType] = useState("");
  const [jobSector, setJobSector] = useState("");

  const isJobs = category === "jobs";

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const combined = [...images, ...files].slice(0, 6);
    setImages(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!category) return setErrorMsg("Choisis une catégorie.");
    if (!title.trim()) return setErrorMsg("Le titre est obligatoire.");

    if (isJobs) {
      if (!jobType) return setErrorMsg("Choisis un type de contrat.");
      if (!jobSector) return setErrorMsg("Choisis un secteur.");
    } else {
      if (!price || Number(price) <= 0) return setErrorMsg("Indique un prix valide.");
      if (images.length === 0) return setErrorMsg("Ajoute au moins une photo.");
    }

    if (!wilaya) return setErrorMsg("Choisis une wilaya.");
    if (!description.trim()) return setErrorMsg("La description est obligatoire.");

    setSubmitting(true);
    setProgress(0);

    const { id, error } = await createListing(
      {
        title: title.trim(),
        price: price ? Number(price) : 0,
        category,
        wilaya,
        city: city.trim(),
        condition: isJobs ? "used" : condition,
        description: description.trim(),
        contactPhone: phone.trim(),
        isNegotiable,
        isUrgent,
        images,
        ...(isJobs ? { jobKind, jobType, jobSector } : {}),
      },
      setProgress
    );

    setSubmitting(false);

    if (error || !id) {
      setErrorMsg(`Erreur lors de la publication : ${error ?? "inconnue"}`);
      return;
    }

    navigate(`/listing/${id}`);
  };

  return (
    <div className="bg-white min-h-screen pb-32">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <ChevronLeft className={`w-5 h-5 text-gray-700 ${isRTL ? "rotate-180" : ""}`} />
        </button>
        <h1 className="text-base font-bold text-gray-900">
          {isJobs ? (jobKind === "offer" ? "Publier une offre d'emploi" : "Publier une demande d'emploi") : "Publier une annonce"}
        </h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Catégorie</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium border ${
                  category === c.id ? "bg-[#1B6B3A] text-white border-[#1B6B3A]" : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                <span>{c.icon}</span>
                <span>{t(c.id as any)}</span>
              </button>
            ))}
          </div>
        </div>

        {isJobs && (
          <div className="rounded-2xl bg-[#1B6B3A]/5 border border-[#1B6B3A]/15 p-3.5 space-y-3.5">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1B6B3A]" />
              <p className="text-sm font-bold text-[#1B6B3A]">Détails de l'emploi</p>
            </div>

            <div className="flex bg-white rounded-2xl p-1 border border-gray-100">
              {[
                { id: "offer" as const, label: "Je recrute" },
                { id: "seeking" as const, label: "Je cherche un emploi" },
              ].map((k) => (
                <button
                  key={k.id}
                  onClick={() => setJobKind(k.id)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                    jobKind === k.id ? "bg-[#1B6B3A] text-white" : "text-gray-500"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Type de contrat</p>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((jt) => (
                  <button
                    key={jt}
                    onClick={() => setJobType(jt)}
                    className={`px-3.5 py-2 rounded-full text-[13px] font-semibold border ${
                      jobType === jt ? "bg-[#1B6B3A] text-white border-[#1B6B3A]" : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {jt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Secteur</p>
              <select
                className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-3 text-sm outline-none text-gray-800"
                value={jobSector}
                onChange={(e) => setJobSector(e.target.value)}
              >
                <option value="">Choisir un secteur</option>
                {JOB_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">
            {isJobs ? `Photo ou logo (facultatif) (${images.length}/6)` : `Photos (${images.length}/6)`}
          </p>
          <div className="flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <button
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="w-20 h-20 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer">
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-400 mt-1">Ajouter</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
              </label>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">{isJobs ? "Intitulé du poste" : "Titre"}</p>
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder={
              isJobs
                ? jobKind === "offer"
                  ? "Ex : Développeur web, Vendeur, Chauffeur"
                  : "Ex : Comptable, 5 ans d'expérience"
                : "Ex : iPhone 13 Pro 256Go"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">
            {isJobs ? `Salaire par mois (${t("da")}) (facultatif)` : `Prix (${t("da")})`}
          </p>
          <input
            type="number"
            inputMode="numeric"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder={isJobs ? "Laisser vide = à discuter" : "0"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Wilaya</p>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-sm outline-none"
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
            >
              <option value="">Choisir</option>
              {WILAYA_OPTIONS.map((w) => (
                <option key={w.code} value={w.name}>
                  {String(w.code).padStart(2, "0")} - {isRTL ? w.nameAr : w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Ville (optionnel)</p>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-sm outline-none"
              placeholder="Ex : Boufarik"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        {!isJobs && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">État</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCondition("new")}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold ${condition === "new" ? "bg-[#1B6B3A] text-white" : "bg-gray-50 text-gray-600"}`}
              >
                {t("conditionNew")}
              </button>
              <button
                onClick={() => setCondition("used")}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold ${condition === "used" ? "bg-[#1B6B3A] text-white" : "bg-gray-50 text-gray-600"}`}
              >
                {t("conditionUsed")}
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">
            {isJobs ? (jobKind === "offer" ? "Description du poste" : "Votre profil") : "Description"}
          </p>
          <textarea
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none"
            placeholder={
              isJobs
                ? jobKind === "offer"
                  ? "Missions, profil recherché, horaires, avantages..."
                  : "Expérience, diplômes, compétences, disponibilité..."
                : "Décris ton produit, son état, les détails importants..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Téléphone de contact (optionnel)</p>
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="0555 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} />
            {isJobs ? "Salaire négociable" : t("negotiable")}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
            {t("urgent")}
          </label>
        </div>

        {errorMsg && <p className="text-sm text-red-500 font-medium">{errorMsg}</p>}
      </div>

      <div className="fixed bottom-[60px] left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-100 px-4 py-3 z-[30]">
        {submitting && (
          <div className="mb-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1B6B3A] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 text-center">
              {progress < 90 && images.length > 0 ? "Envoi des photos..." : "Publication de l'annonce..."}
            </p>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl bg-[#1B6B3A] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Publication..." : isJobs ? "Publier l'offre" : "Publier l'annonce"}
        </button>
      </div>
    </div>
  );
}
