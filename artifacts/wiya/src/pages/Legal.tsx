import { useParams, useLocation } from "wouter";
import { Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";

// À MODIFIER : ton adresse e-mail de contact (affichée sur la page Contact)
const CONTACT_EMAIL = "contact@exemple.com";

type Section = { title: string; body: string };

const CONTENT: Record<"terms" | "privacy", { fr: { title: string; sections: Section[] }; ar: { title: string; sections: Section[] } }> = {
  terms: {
    fr: {
      title: "Conditions d'utilisation",
      sections: [
        { title: "1. Le service", body: "Wiya est une plateforme de petites annonces qui met en relation des acheteurs et des vendeurs en Algérie. Wiya ne vend pas, n'achète pas et ne livre pas d'articles, et ne garantit ni l'état, ni la qualité, ni la légalité des articles proposés." },
        { title: "2. Votre compte", body: "Vous vous engagez à fournir des informations exactes et à protéger l'accès à votre compte. Vous êtes responsable de ce qui est fait avec votre compte." },
        { title: "3. Vos annonces", body: "Une annonce doit être honnête : photos réelles de l'article, prix exact, description fidèle. Il est interdit de publier tout ce qui est interdit par la loi algérienne, ainsi que les armes, les drogues, les contrefaçons, les contenus choquants et les arnaques. Wiya peut supprimer une annonce ou un compte sans préavis en cas de non-respect." },
        { title: "4. Durée des annonces", body: "Une annonce reste en ligne 60 jours, puis expire. Vous pouvez la renouveler depuis votre profil dans les 30 jours qui suivent. Passé ce délai, ses photos et sa vidéo sont supprimées." },
        { title: "5. Sécurité des transactions", body: "Rencontrez le vendeur dans un lieu public, vérifiez l'article avant de payer et ne payez jamais à l'avance. Wiya n'intervient pas dans les paiements entre utilisateurs et n'est pas responsable des litiges entre eux." },
        { title: "6. Boosts", body: "Le boost met une annonce en avant pour la durée choisie. Il est activé après vérification du reçu de paiement envoyé par le vendeur." },
        { title: "7. Signalements", body: "Chaque utilisateur peut signaler une annonce. Wiya examine les signalements et peut supprimer les annonces non conformes." },
        { title: "8. Modifications", body: "Ces conditions peuvent évoluer. En continuant à utiliser Wiya, vous acceptez la version en vigueur." },
      ],
    },
    ar: {
      title: "شروط الاستخدام",
      sections: [
        { title: "1. الخدمة", body: "ويا منصة إعلانات مبوبة تربط بين المشترين والبائعين في الجزائر. ويا لا تبيع ولا تشتري ولا توصّل السلع، ولا تضمن حالة السلع أو جودتها أو قانونيتها." },
        { title: "2. حسابك", body: "تلتزم بتقديم معلومات صحيحة وبحماية الدخول إلى حسابك. أنت المسؤول عمّا يتم عبر حسابك." },
        { title: "3. إعلاناتك", body: "يجب أن يكون الإعلان صادقا: صور حقيقية للسلعة وسعر صحيح ووصف مطابق. يُمنع نشر كل ما تمنعه القوانين الجزائرية، وكذلك الأسلحة والمخدرات والسلع المقلدة والمحتوى الصادم والاحتيال. يمكن لويا حذف أي إعلان أو حساب دون إشعار مسبق عند المخالفة." },
        { title: "4. مدة الإعلانات", body: "يبقى الإعلان ظاهرا 60 يوما ثم ينتهي. يمكنك تجديده من ملفك الشخصي خلال 30 يوما بعد ذلك. بعد هذه المدة تُحذف صوره وفيديوه." },
        { title: "5. أمان المعاملات", body: "قابل البائع في مكان عام، وافحص السلعة قبل الدفع ولا تدفع مسبقا أبدا. ويا لا تتدخل في المدفوعات بين المستخدمين ولا تتحمل مسؤولية النزاعات بينهم." },
        { title: "6. التعزيز", body: "يُبرز التعزيز الإعلان طوال المدة المختارة. ويتم تفعيله بعد التحقق من وصل الدفع الذي يرسله البائع." },
        { title: "7. الإبلاغ", body: "يمكن لكل مستخدم الإبلاغ عن إعلان. تراجع ويا البلاغات ويمكنها حذف الإعلانات المخالفة." },
        { title: "8. التعديلات", body: "قد تتغير هذه الشروط. باستمرارك في استخدام ويا فإنك توافق على النسخة السارية." },
      ],
    },
  },
  privacy: {
    fr: {
      title: "Politique de confidentialité",
      sections: [
        { title: "Les données que nous gardons", body: "Votre nom, votre adresse email, votre numéro de téléphone et votre wilaya (si vous les renseignez), vos annonces (texte, photos, vidéo), vos messages et vos favoris." },
        { title: "À quoi elles servent", body: "À faire fonctionner Wiya : afficher vos annonces, permettre aux acheteurs de vous contacter, envoyer les messages et vous prévenir des nouvelles annonces qui vous intéressent." },
        { title: "Ce qui est visible par les autres", body: "Le titre, les photos, la description et le prix de vos annonces, votre nom, et le numéro de téléphone que vous choisissez d'indiquer sur une annonce. Vos messages ne sont visibles que par les personnes concernées." },
        { title: "Où elles sont stockées", body: "Vos données sont hébergées chez des prestataires techniques (Supabase pour la base de données et les fichiers, Vercel pour le site). Nous ne vendons pas vos données." },
        { title: "Sur votre appareil", body: "Wiya garde sur votre téléphone votre langue, votre thème, vos favoris et vos recherches récentes, pour que l'app fonctionne plus vite." },
        { title: "Vos droits", body: "Vous pouvez modifier vos informations depuis votre profil, supprimer vos annonces à tout moment, et demander la suppression de votre compte et de vos données en nous contactant." },
      ],
    },
    ar: {
      title: "سياسة الخصوصية",
      sections: [
        { title: "البيانات التي نحتفظ بها", body: "اسمك وبريدك الإلكتروني ورقم هاتفك وولايتك (إذا أدخلتها)، وإعلاناتك (النص والصور والفيديو)، ورسائلك ومفضلتك." },
        { title: "فيما تُستخدم", body: "لتشغيل ويا: عرض إعلاناتك، وتمكين المشترين من التواصل معك، وإرسال الرسائل، وتنبيهك بالإعلانات الجديدة التي تهمك." },
        { title: "ما يراه الآخرون", body: "عنوان إعلاناتك وصورها ووصفها وسعرها، واسمك، ورقم الهاتف الذي تختار وضعه في الإعلان. رسائلك لا يراها إلا المعنيون بها." },
        { title: "أين تُخزَّن", body: "تُستضاف بياناتك لدى مزوّدين تقنيين (Supabase لقاعدة البيانات والملفات، وVercel للموقع). نحن لا نبيع بياناتك." },
        { title: "على جهازك", body: "يحتفظ ويا على هاتفك بلغتك ومظهرك ومفضلتك وعمليات بحثك الأخيرة ليعمل التطبيق بسرعة أكبر." },
        { title: "حقوقك", body: "يمكنك تعديل معلوماتك من ملفك الشخصي، وحذف إعلاناتك في أي وقت، وطلب حذف حسابك وبياناتك عبر التواصل معنا." },
      ],
    },
  },
};

export default function LegalPage() {
  const params = useParams<{ page: string }>();
  const [, navigate] = useLocation();
  const { isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);

  const page = params.page === "privacy" || params.page === "contact" ? params.page : "terms";

  const tabs = [
    { id: "terms", label: tr("Conditions", "الشروط") },
    { id: "privacy", label: tr("Confidentialité", "الخصوصية") },
    { id: "contact", label: tr("Contact", "اتصل بنا") },
  ];

  return (
    <div className="bg-card min-h-[100dvh] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <AppHeader title={tr("Informations", "معلومات")} showBack />

      <div className="flex gap-2 px-5 pt-2 pb-4">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => navigate(`/legal/${tb.id}`)}
            className={`px-4 py-2 rounded-full text-[14px] transition-colors ${
              page === tb.id
                ? "bg-foreground text-background font-bold"
                : "bg-card ring-1 ring-border text-foreground font-medium"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="px-5">
        {page === "contact" ? (
          <div>
            <h1 className="font-display text-[24px] font-extrabold text-foreground">{tr("Nous contacter", "اتصل بنا")}</h1>
            <p className="text-[15px] text-foreground/80 leading-relaxed mt-3">
              {tr(
                "Une question, un problème, une annonce à signaler ou une demande de suppression de compte ? Écrivez-nous :",
                "سؤال أو مشكلة أو إعلان تريد الإبلاغ عنه أو طلب حذف حساب؟ راسلنا:"
              )}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm"
            >
              <Mail className="w-4 h-4" />
              <span dir="ltr">{CONTACT_EMAIL}</span>
            </a>
          </div>
        ) : (
          <div>
            <h1 className="font-display text-[24px] font-extrabold text-foreground">
              {CONTENT[page][isRTL ? "ar" : "fr"].title}
            </h1>
            <div className="mt-4 space-y-5">
              {CONTENT[page][isRTL ? "ar" : "fr"].sections.map((s) => (
                <div key={s.title}>
                  <h2 className="text-[15px] font-bold text-foreground">{s.title}</h2>
                  <p className="text-[14px] text-foreground/75 leading-relaxed mt-1">{s.body}</p>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground mt-8">
              {tr("Dernière mise à jour : octobre 2026", "آخر تحديث: أكتوبر 2026")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
