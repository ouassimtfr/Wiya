import { useState } from "react";
import { useLocation } from "wouter";
import { Camera, X, ChevronDown, Check, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES, WILAYAS } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export default function PostListingPage() {
 const [, navigate] = useLocation();
 const { t } = useI18n();
 const { user } = useStore();

 const [step, setStep] = useState(1);
 const [photos, setPhotos] = useState<string[]>([]);
 const [uploadingPhoto, setUploadingPhoto] = useState(false);
 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [price, setPrice] = useState("");
 const [negotiable, setNegotiable] = useState(false);
 const [urgent, setUrgent] = useState(false);
 const [category, setCategory] = useState("");
 const [wilaya, setWilaya] = useState("");
 const [condition, setCondition] = useState<"new" | "used">("used");
 const [published, setPublished] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 if (!user) {
   return (
     <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center gap-4">
       <div className="text-5xl">📢</div>
       <h2 className="text-base font-bold text-gray-900">{t("notLoggedIn")}</h2>
       <p className="text-sm text-gray-500">{t("notLoggedInDesc")}</p>
       <button onClick={() => navigate("/auth")} className="px-8 py-3 bg-[#1B6B3A] text-white rounded-2xl font-semibold text-sm">
         {t("login")}
       </button>
     </div>
   );
 }

 const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (!file || photos.length >= 5) return;

   setUploadingPhoto(true);
   try {
     const ext = file.name.split(".").pop();
     const fileName = `${user.id}/${Date.now()}.${ext}`;
     const { error: uploadError } = await supabase.storage
       .from("listings")
       .upload(fileName, file);

     if (uploadError) throw uploadError;

     const { data } = supabase.storage.from("listings").getPublicUrl(fileName);
     setPhotos((p) => [...p, data.publicUrl]);
   } catch (err) {
     setError("Erreur upload photo. Réessaie.");
   } finally {
     setUploadingPhoto(false);
   }
 };

 const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

 const handlePublish = async () => {
   setLoading(true);
   setError("");
   try {
     const { error: insertError } = await supabase.from("listings").insert({
       user_id: user.id,
       title,
       description,
       price: price ? parseFloat(price) : null,
       category,
       wilaya,
       images: photos,
       is_active: true,
       is_negotiable: negotiable,
       is_urgent: urgent,
       condition,
     });
     if (insertError) throw insertError;
     setPublished(true);
     setTimeout(() => navigate("/"), 2000);
   } catch (err: any) {
     setError("Erreur lors de la publication. Réessaie.");
   } finally {
     setLoading(false);
   }
 };

 if (published) {
   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="min-h-screen bg-[#1B6B3A] flex flex-col items-center justify-center px-8 text-center gap-4"
     >
       <motion.div
         initial={{ scale: 0 }}
         animate={{ scale: 1 }}
         transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
         className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl"
       >
         <Check className="w-10 h-10 text-[#1B6B3A]" />
       </motion.div>
       <h2 className="text-white text-xl font-black">{t("publishSuccess")}</h2>
       <p className="text-green-200 text-sm">Votre annonce est en ligne !</p>
     </motion.div>
   );
 }

 return (
   <div className="bg-white min-h-screen pb-64">
     <div className="bg-[#1B6B3A] pt-12 pb-4 px-4 flex items-center gap-3">
       <button onClick={() => navigate("/" as any)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
         <ArrowLeft className="w-4 h-4 text-white" />
       </button>
       <h1 className="text-white font-bold text-base">{t("postListing")}</h1>
     </div>

     <div className="flex px-4 py-4 gap-1.5">
       {[1, 2, 3].map((s) => (
         <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-[#1B6B3A]" : "bg-gray-100"}`} />
       ))}
     </div>

     <div className="px-4 space-y-5">
       {error && (
         <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
       )}

       <AnimatePresence mode="wait">
         {step === 1 && (
           <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
             <h2 className="text-base font-bold text-gray-900">📸 Photos de l'annonce</h2>
             <div className="grid grid-cols-3 gap-2">
               {photos.map((photo, i) => (
                 <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                   <img src={photo} alt="" className="w-full h-full object-cover" />
                   <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                     <X className="w-3 h-3 text-white" />
                   </button>
                   {i === 0 && (
                     <span className="absolute bottom-1 left-1 text-[9px] bg-[#1B6B3A] text-white px-1.5 py-0.5 rounded-full font-bold">Principale</span>
                   )}
                 </div>
               ))}
               {photos.length < 5 && (
                 <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 cursor-pointer active:bg-gray-50">
                   {uploadingPhoto ? (
                     <div className="w-6 h-6 border-2 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <>
                       <Camera className="w-6 h-6" />
                       <span className="text-[10px] font-medium">{t("addPhoto")}</span>
                     </>
                   )}
                   <input
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={handlePhotoUpload}
                     disabled={uploadingPhoto}
                   />
                 </label>
               )}
             </div>
             <p className="text-xs text-gray-400 text-center">{photos.length}/5 photos ajoutées</p>
           </motion.div>
         )}

         {step === 2 && (
           <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
             <h2 className="text-base font-bold text-gray-900">📝 Détails de l'annonce</h2>
             <div>
               <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("titleField")} *</label>
               <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("addTitle")} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A]" />
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("category")} *</label>
               <div className="relative">
                 <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none">
                   <option value="">{t("selectCategory")}</option>
                   {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {t(c.id as any)}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("description")}</label>
               <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("addDescription")} rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A] resize-none" />
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 mb-2 block">{t("condition")}</label>
               <div className="flex gap-2">
                 {(["new", "used"] as const).map((c) => (
                   <button key={c} onClick={() => setCondition(c)} className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors border-2 ${condition === c ? "border-[#1B6B3A] bg-green-50 text-[#1B6B3A]" : "border-gray-200 text-gray-500"}`}>
                     {c === "new" ? t("conditionNew") : t("conditionUsed")}
                   </button>
                 ))}
               </div>
             </div>
           </motion.div>
         )}

         {step === 3 && (
           <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
             <h2 className="text-base font-bold text-gray-900">💰 Prix & Localisation</h2>
             <div>
               <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("price")} (DA) *</label>
               <div className="relative">
                 <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("addPrice")} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#1B6B3A] pr-16" />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">DA</span>
               </div>
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("wilaya")} *</label>
               <div className="relative">
                 <select value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none">
                   <option value="">{t("selectWilaya")}</option>
                   {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>
             </div>
             <div className="space-y-3">
               {[
                 { label: t("isNegotiable"), desc: "Acceptez les offres de prix", value: negotiable, set: setNegotiable },
                 { label: t("isUrgent"), desc: "Badge rouge pour vendre vite", value: urgent, set: setUrgent },
               ].map((opt) => (
                 <div key={opt.label} onClick={() => opt.set(!opt.value)} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${opt.value ? "bg-[#1B6B3A] border-[#1B6B3A]" : "border-gray-300"}`}>
                     {opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                     <p className="text-xs text-gray-400">{opt.desc}</p>
                   </div>
                 </div>
               ))}
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </div>

     <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 flex gap-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)" }}>
       {step > 1 && (
         <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm">
           Retour
         </button>
       )}
       <button
         onClick={() => step < 3 ? setStep(step + 1) : handlePublish()}
         disabled={(step === 2 && !title) || loading}
         className="flex-1 py-3.5 rounded-2xl bg-[#1B6B3A] text-white font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-50"
       >
         {loading ? "Publication..." : step < 3 ? "Continuer" : t("publish")}
       </button>
     </div>
   </div>
 );
}
