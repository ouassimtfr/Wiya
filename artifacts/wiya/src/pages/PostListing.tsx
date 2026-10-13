import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Camera, X, Loader2, Briefcase, Sparkles, Video } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { WILAYAS_DATA } from "@/lib/wilayas";
import { compressImages, enhanceImage } from "@/lib/imageCompress";

const MAX_VIDEO_MB = 45; // le plan gratuit Supabase refuse les fichiers de plus de 50 Mo
const MAX_VIDEO_SEC = 30;

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

const JOB_SECTOR_AR: Record<string, string> = {
  Informatique: "إعلام آلي",
  "Commerce et vente": "تجارة وبيع",
  "Restauration et hôtellerie": "مطاعم وفندقة",
  "Bâtiment et travaux": "بناء وأشغال",
  Santé: "صحة",
  "Éducation et formation": "تعليم وتكوين",
  "Transport et logistique": "نقل ولوجستيك",
  "Administration et comptabilité": "إدارة ومحاسبة",
  Industrie: "صناعة",
  "Marketing et communication": "تسويق واتصال",
  Autre: "أخرى",
};

const WILAYA_OPTIONS = WILAYAS_DATA.slice().sort((a, b) => a.code - b.code);

export default function PostListingPage() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
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
  // Photo d'origine gardée quand on a amélioré la photo (null = pas améliorée)
  const [originals, setOriginals] = useState<(File | null)[]>([]);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoError, setVideoError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [jobSector, setJobSector] = useState("");

  const isJobs = category === "jobs";

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user]);

  if (!user) return null;

  // Les photos sont compressées dès qu'elles sont choisies :
  // l'aperçu s'affiche vite et l'envoi final est beaucoup plus léger.
  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = Math.max(0, 6 - images.length);
    const picked = files.slice(0, room);
    if (picked.length === 0) return;

    setCompressing(true);
    const compressed = await compressImages(picked, 1280, 0.82);
    setCompressing(false);

    setImages((prev) => [...prev, ...compressed].slice(0, 6));
    setOriginals((prev) => [...prev, ...compressed.map(() => null)].slice(0, 6));
    setPreviews((prev) =>
      [...prev, ...compressed.map((f) => URL.createObjectURL(f))].slice(0, 6)
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setOriginals((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const replaceImage = (index: number, file: File, original: File | null) => {
    setImages((prev) => prev.map((f, i) => (i === index ? file : f)));
    setOriginals((prev) => prev.map((f, i) => (i === index ? original : f)));
    setPreviews((prev) =>
      prev.map((src, i) => {
        if (i !== index) return src;
        URL.revokeObjectURL(src);
        return URL.createObjectURL(file);
      })
    );
  };

  // Améliore la photo (lumière, couleurs, netteté) ; un deuxième appui revient à l'original
  const toggleEnhance = async (index: number) => {
    if (enhancingIndex !== null) return;
    const original = originals[index];
    if (original) {
      replaceImage(index, original, null);
      return;
    }
    setEnhancingIndex(index);
    const current = images[index];
    const better = await enhanceImage(current);
    replaceImage(index, better, current);
    setEnhancingIndex(null);
  };

  const handleAddVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setVideoError("");

    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setVideoError(
        tr(
          `Vidéo trop lourde (${MAX_VIDEO_MB} Mo maximum). Filmez plus court ou en qualité HD 720p.`,
          `الفيديو ثقيل جدا (الحد الأقصى ${MAX_VIDEO_MB} ميغا). صوّر فيديو أقصر أو بجودة 720p.`
        )
      );
      return;
    }

    const url = URL.createObjectURL(file);
    const duration = await new Promise<number>((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => resolve(v.duration);
      v.onerror = () => resolve(0);
      v.src = url;
    });

    if (duration && duration > MAX_VIDEO_SEC + 0.5) {
      URL.revokeObjectURL(url);
      setVideoError(
        tr(
          `Vidéo trop longue (${MAX_VIDEO_SEC} secondes maximum).`,
          `الفيديو طويل جدا (${MAX_VIDEO_SEC} ثانية كحد أقصى).`
        )
      );
      return;
    }

    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(file);
    setVideoPreview(url);
  };

  const handleRemoveVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(null);
    setVideoPreview(null);
    setVideoError("");
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (compressing || enhancingIndex !== null) return;
    if (!category) return setErrorMsg(tr("Choisis une catégorie.", "اختر فئة."));
    if (!title.trim()) return setErrorMsg(tr("Le titre est obligatoire.", "العنوان إجباري."));

    if (isJobs) {
      if (!jobSector) return setErrorMsg(tr("Choisis un secteur.", "اختر القطاع."));
    } else {
      if (!price || Number(price) <= 0) return setErrorMsg(tr("Indique un prix valide.", "أدخل سعرا صحيحا."));
      if (images.length === 0) return setErrorMsg(tr("Ajoute au moins une photo.", "أضف صورة واحدة على الأقل."));
    }

    if (!wilaya) return setErrorMsg(tr("Choisis une wilaya.", "اختر الولاية."));
    if (!description.trim()) return setErrorMsg(tr("La description est obligatoire.", "الوصف إجباري."));

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
        video,
        ...(isJobs ? { jobKind: "seeking" as const, jobSector } : {}),
      },
      setProgress
    );

    setSubmitting(false);

    if (error || !id) {
      setErrorMsg(
        `${tr("Erreur lors de la publication", "خطأ أثناء النشر")} : ${error ?? tr("inconnue", "غير معروف")}`
      );
      return;
    }

    navigate(`/listing/${id}`);
  };

  const labelClass = "text-xs font-bold text-gray-500 uppercase mb-1.5";
  const busy = compressing || enhancingIndex !== null;

  return (
    <div className="bg-white min-h-[100dvh] pb-[calc(11rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <ChevronLeft className={`w-5 h-5 text-gray-700 ${isRTL ? "rotate-180" : ""}`} />
        </button>
        <h1 className="text-base font-bold text-gray-900">
          {isJobs ? tr("Publier une demande d'emploi", "نشر طلب عمل") : tr("Publier une annonce", "نشر إعلان")}
        </h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div>
          <p className={labelClass}>{tr("Catégorie", "الفئة")}</p>
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
              <p className="text-sm font-bold text-[#1B6B3A]">{tr("Je cherche un emploi", "أبحث عن عمل")}</p>
            </div>

            <div>
              <p className={labelClass}>{tr("Secteur", "القطاع")}</p>
              <select
                className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-3 text-base outline-none text-gray-800"
                value={jobSector}
                onChange={(e) => setJobSector(e.target.value)}
              >
                <option value="">{tr("Choisir un secteur", "اختر القطاع")}</option>
                {JOB_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {isRTL ? JOB_SECTOR_AR[s] ?? s : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ─── Photos et vidéo ─── */}
        <div className="rounded-2xl border border-gray-200 p-3.5">
          <p className="text-[15px] font-bold text-gray-900">
            {isJobs ? tr("Photo", "الصورة") : tr("Photos et vidéo", "الصور والفيديو")}
          </p>
          <p className="text-[13px] text-gray-500 leading-snug mt-1">
            {isJobs
              ? tr("Vous pouvez ajouter une photo (facultatif).", "يمكنك إضافة صورة (اختياري).")
              : tr(
                  `Ajoutez jusqu'à 6 photos et 1 vidéo de ${MAX_VIDEO_SEC} secondes. De belles photos et une vidéo rassurent l'acheteur.`,
                  `أضف حتى 6 صور وفيديو واحد مدته ${MAX_VIDEO_SEC} ثانية. الصور الجميلة والفيديو يطمئنان المشتري.`
                )}
          </p>

          <p className={`${labelClass} mt-3`}>
            {tr("Photos", "الصور")} ({images.length}/6)
          </p>
          <div className="flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              <div key={src} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <button
                  onClick={() => handleRemoveImage(i)}
                  aria-label={tr("Retirer la photo", "إزالة الصورة")}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={() => toggleEnhance(i)}
                  disabled={busy}
                  aria-label={
                    originals[i]
                      ? tr("Revenir à la photo d'origine", "العودة إلى الصورة الأصلية")
                      : tr("Améliorer la photo", "تحسين الصورة")
                  }
                  className={`absolute bottom-1 left-1 right-1 h-7 rounded-lg flex items-center justify-center gap-1 text-[11px] font-bold disabled:opacity-60 ${
                    originals[i] ? "bg-[#C8972B] text-white" : "bg-black/60 text-white"
                  }`}
                >
                  {enhancingIndex === i ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {originals[i] ? tr("Original", "الأصلية") : tr("Améliorer", "تحسين")}
                    </>
                  )}
                </button>
              </div>
            ))}
            {compressing && (
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center animate-pulse">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
            {images.length < 6 && !compressing && (
              <label className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer">
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-[11px] text-gray-400 mt-1">{tr("Ajouter", "إضافة")}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
              </label>
            )}
          </div>
          {images.length > 0 && (
            <p className="text-[12px] text-gray-400 mt-2">
              {tr(
                "Touchez « Améliorer » pour corriger automatiquement la lumière et les couleurs d'une photo.",
                "اضغط على «تحسين» لتصحيح الإضاءة والألوان تلقائيا."
              )}
            </p>
          )}

          {/* Vidéo */}
          {!isJobs && (
            <>
              <p className={`${labelClass} mt-4`}>
                {tr(`Vidéo (facultatif, ${MAX_VIDEO_SEC} s max)`, `فيديو (اختياري، ${MAX_VIDEO_SEC} ثانية كحد أقصى)`)}
              </p>
              {videoPreview ? (
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <video src={videoPreview} controls playsInline muted className="w-full max-h-56" />
                  <button
                    onClick={handleRemoveVideo}
                    aria-label={tr("Retirer la vidéo", "إزالة الفيديو")}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/65 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* Choisir une vidéo déjà enregistrée sur le téléphone */}
                  <label className="flex flex-col items-center justify-center gap-1 py-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 text-[13px] font-semibold text-gray-600 cursor-pointer text-center">
                    <Video className="w-5 h-5" />
                    {tr("Choisir une vidéo", "اختيار فيديو")}
                    <input type="file" accept="video/*" className="hidden" onChange={handleAddVideo} />
                  </label>
                  {/* Filmer directement avec la caméra */}
                  <label className="flex flex-col items-center justify-center gap-1 py-4 rounded-2xl bg-[#1B6B3A]/5 border-2 border-dashed border-[#1B6B3A]/30 text-[13px] font-semibold text-[#1B6B3A] cursor-pointer text-center">
                    <Camera className="w-5 h-5" />
                    {tr("Filmer maintenant", "صوّر الآن")}
                    <input type="file" accept="video/*" capture="environment" className="hidden" onChange={handleAddVideo} />
                  </label>
                </div>
              )}
              {videoError && <p className="text-xs text-red-500 font-medium mt-2">{videoError}</p>}
            </>
          )}
        </div>

        <div>
          <p className={labelClass}>{isJobs ? tr("Poste recherché", "المنصب المطلوب") : tr("Titre", "العنوان")}</p>
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base outline-none"
            placeholder={
              isJobs
                ? tr("Ex : Comptable, 5 ans d'expérience", "مثال: محاسب، 5 سنوات خبرة")
                : tr("Ex : iPhone 13 Pro 256Go", "مثال: iPhone 13 Pro 256Go")
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <p className={labelClass}>
            {isJobs
              ? `${tr("Salaire souhaité par mois", "الراتب المطلوب شهريا")} (${t("da")}) (${tr("facultatif", "اختياري")})`
              : `${tr("Prix", "السعر")} (${t("da")})`}
          </p>
          <input
            type="number"
            inputMode="numeric"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base outline-none"
            placeholder={isJobs ? tr("Laisser vide = à discuter", "اتركه فارغا = قابل للنقاش") : "0"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={labelClass}>{tr("Wilaya", "الولاية")}</p>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-base outline-none"
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
            >
              <option value="">{tr("Choisir", "اختر")}</option>
              {WILAYA_OPTIONS.map((w) => (
                <option key={w.code} value={w.name}>
                  {String(w.code).padStart(2, "0")} - {isRTL ? w.nameAr : w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelClass}>{tr("Ville (optionnel)", "المدينة (اختياري)")}</p>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-base outline-none"
              placeholder={tr("Ex : Boufarik", "مثال: بوفاريك")}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        {!isJobs && (
          <div>
            <p className={labelClass}>{tr("État", "الحالة")}</p>
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
          <p className={labelClass}>{isJobs ? tr("Votre profil", "ملفك الشخصي") : tr("Description", "الوصف")}</p>
          <textarea
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base outline-none resize-none"
            placeholder={
              isJobs
                ? tr(
                    "Expérience, diplômes, compétences, disponibilité...",
                    "الخبرة، الشهادات، المهارات، التوفر..."
                  )
                : tr(
                    "Décris ton produit, son état, les détails importants...",
                    "صف منتجك وحالته والتفاصيل المهمة..."
                  )
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <p className={labelClass}>{tr("Téléphone de contact (optionnel)", "هاتف التواصل (اختياري)")}</p>
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base outline-none"
            placeholder="0555 12 34 56"
            inputMode="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} />
            {isJobs ? tr("Salaire négociable", "الراتب قابل للتفاوض") : t("negotiable")}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
            {t("urgent")}
          </label>
        </div>

        {errorMsg && <p className="text-sm text-red-500 font-medium">{errorMsg}</p>}
      </div>

      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 max-w-[430px] mx-auto bg-white border-t border-gray-100 px-4 py-3 z-[30]">
        {submitting && (
          <div className="mb-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1B6B3A] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 text-center">
              {progress < 90 && (images.length > 0 || video)
                ? video
                  ? tr("Envoi des photos et de la vidéo...", "جاري إرسال الصور والفيديو...")
                  : tr("Envoi des photos...", "جاري إرسال الصور...")
                : tr("Publication de l'annonce...", "جاري نشر الإعلان...")}
            </p>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || busy}
          className="w-full py-3.5 rounded-2xl bg-[#1B6B3A] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting || busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {compressing
            ? tr("Préparation des photos...", "جاري تجهيز الصور...")
            : enhancingIndex !== null
            ? tr("Amélioration de la photo...", "جاري تحسين الصورة...")
            : submitting
            ? tr("Publication...", "جاري النشر...")
            : isJobs
            ? tr("Publier ma demande", "نشر طلبي")
            : tr("Publier l'annonce", "نشر الإعلان")}
        </button>
      </div>
    </div>
  );
}
