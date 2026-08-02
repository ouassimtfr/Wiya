import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Camera, X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES, WILAYAS } from "@/lib/data";

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
  const [errorMsg, setErrorMsg] = useState("");

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

    if (!title.trim()) return setErrorMsg("Le titre est obligatoire.");
    if (!price || Number(price) <= 0) return setErrorMsg("Indique un prix valide.");
    if (!category) return setErrorMsg("Choisis une catégorie.");
    if (!wilaya) return setErrorMsg("Choisis une wilaya.");
    if (!description.trim()) return setErrorMsg("La description est obligatoire.");
    if (images.length === 0) return setErrorMsg("Ajoute au moins une photo.");

    setSubmitting(true);

    const { id, error } = await createListing({
      title: title.trim(),
      price: Number(price),
      category,
      wilaya,
      city: city.trim(),
      condition,
      description: description.trim(),
      contactPhone: phone.trim(),
      isNegotiable,
      isUrgent,
      images,
    });

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
        <h1 className="text-base font-bold text-gray-900">Publier une annonce</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Photos */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Photos ({images.length}/6)</p>
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

        {/* Titre */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Titre</p>
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="Ex : iPhone 13 Pro 256Go"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Prix */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Prix ({t("da")})</p>
          <input
            type="number"
            inputMode="numeric"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {/* Catégorie */}
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

        {/* Wilaya + ville */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Wilaya</p>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-sm outline-none"
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
            >
              <option value="">Choisir</option>
              {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
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

        {/* État */}
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

        {/* Description */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Description</p>
          <textarea
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none"
            placeholder="Décris ton produit, son état, les détails importants..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Téléphone */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Téléphone de contact (optionnel)</p>
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="0555 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Options */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} />
            {t("negotiable")}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
            {t("urgent")}
          </label>
        </div>

        {errorMsg && <p className="text-sm text-red-500 font-medium">{errorMsg}</p>}
      </div>

      <div className="fixed bottom-[60px] left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-100 px-4 py-3 z-[30]">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl bg-[#1B6B3A] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Publication..." : "Publier l'annonce"}
        </button>
      </div>
    </div>
  );
}
