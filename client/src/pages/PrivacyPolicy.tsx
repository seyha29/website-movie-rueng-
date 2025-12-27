import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { legalPageLabels } from "@/lib/translations";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-8" data-testid="text-privacy-title">{t("privacyPolicyTitle")}</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-muted-foreground">
            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp1Title")}</h2>
              <p>{t("pp1Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp2Title")}</h2>
              
              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("ppPersonalInfo")}</h3>
              <p className="mb-3">{t("ppPersonalInfoText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("ppPersonalItem1")}</li>
                <li>{t("ppPersonalItem2")}</li>
                <li>{t("ppPersonalItem3")}</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("ppUsageInfo")}</h3>
              <p className="mb-3">{t("ppUsageInfoText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("ppUsageItem1")}</li>
                <li>{t("ppUsageItem2")}</li>
                <li>{t("ppUsageItem3")}</li>
                <li>{t("ppUsageItem4")}</li>
                <li>{t("ppUsageItem5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp3Title")}</h2>
              <p className="mb-3">{t("pp3Text")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("pp3Item1")}</li>
                <li>{t("pp3Item2")}</li>
                <li>{t("pp3Item3")}</li>
                <li>{t("pp3Item4")}</li>
                <li>{t("pp3Item5")}</li>
                <li>{t("pp3Item6")}</li>
                <li>{t("pp3Item7")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp4Title")}</h2>
              <p className="mb-3">{t("pp4Text")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>{t("pp4Item1")}</strong></li>
                <li><strong>{t("pp4Item2")}</strong></li>
                <li><strong>{t("pp4Item3")}</strong></li>
                <li><strong>{t("pp4Item4")}</strong></li>
              </ul>
              <p className="mt-3">{t("pp4NoSell")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp5Title")}</h2>
              <p>{t("pp5Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp6Title")}</h2>
              <p className="mb-3">{t("pp6Text")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("pp6Item1")}</li>
                <li>{t("pp6Item2")}</li>
                <li>{t("pp6Item3")}</li>
                <li>{t("pp6Item4")}</li>
                <li>{t("pp6Item5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp7Title")}</h2>
              <p>{t("pp7Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp8Title")}</h2>
              <p>{t("pp8Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp9Title")}</h2>
              <p>{t("pp9Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp10Title")}</h2>
              <p>{t("pp10Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp11Title")}</h2>
              <p>{t("pp11Text")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("pp12Title")}</h2>
              <p>{t("pp12Text")}</p>
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
