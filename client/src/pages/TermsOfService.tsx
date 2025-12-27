import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { legalPageLabels } from "@/lib/translations";

export default function TermsOfService() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const t = (key: keyof typeof legalPageLabels) => legalPageLabels[key][language];

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-8" data-testid="text-tos-title">{t("termsOfServiceTitle")}</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-muted-foreground">
            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos1Title")}</h2>
              <p>{t("tos1Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos2Title")}</h2>
              <p className="mb-3">{t("tos2Text")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("tos2Item1")}</li>
                <li>{t("tos2Item2")}</li>
                <li>{t("tos2Item3")}</li>
                <li>{t("tos2Item4")}</li>
                <li>{t("tos2Item5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos3Title")}</h2>
              <p>{t("tos3Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos4Title")}</h2>
              <p>{t("tos4Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos5Title")}</h2>
              <p className="mb-3">{t("tos5Text")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("tos5Item1")}</li>
                <li>{t("tos5Item2")}</li>
                <li>{t("tos5Item3")}</li>
                <li>{t("tos5Item4")}</li>
                <li>{t("tos5Item5")}</li>
                <li>{t("tos5Item6")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos6Title")}</h2>
              <p>{t("tos6Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos7Title")}</h2>
              <p>{t("tos7Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos8Title")}</h2>
              <p>{t("tos8Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos9Title")}</h2>
              <p>{t("tos9Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos10Title")}</h2>
              <p>{t("tos10Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("tos11Title")}</h2>
              <p>{t("tos11Text")}</p>
            </section>

            <section className="pt-6 border-t">
              <p className="text-xs">
                {t("lastUpdated")} November 8, 2025
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
