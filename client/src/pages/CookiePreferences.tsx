import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { legalPageLabels } from "@/lib/translations";

export default function CookiePreferences() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-8" data-testid="text-cookies-title">{t("cookiePreferencesTitle")}</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-muted-foreground">
            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("whatAreCookies")}</h2>
              <p>{t("whatAreCookiesText")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("typesOfCookies")}</h2>
              
              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("essentialCookies")}</h3>
              <p className="mb-3">{t("essentialCookiesText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("essentialItem1")}</li>
                <li>{t("essentialItem2")}</li>
                <li>{t("essentialItem3")}</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("functionalCookies")}</h3>
              <p className="mb-3">{t("functionalCookiesText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("functionalItem1")}</li>
                <li>{t("functionalItem2")}</li>
                <li>{t("functionalItem3")}</li>
                <li>{t("functionalItem4")}</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("analyticsCookies")}</h3>
              <p className="mb-3">{t("analyticsCookiesText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("analyticsItem1")}</li>
                <li>{t("analyticsItem2")}</li>
                <li>{t("analyticsItem3")}</li>
                <li>{t("analyticsItem4")}</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("performanceCookies")}</h3>
              <p className="mb-3">{t("performanceCookiesText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("performanceItem1")}</li>
                <li>{t("performanceItem2")}</li>
                <li>{t("performanceItem3")}</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("targetingCookies")}</h3>
              <p className="mb-3">{t("targetingCookiesText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("targetingItem1")}</li>
                <li>{t("targetingItem2")}</li>
                <li>{t("targetingItem3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("managingPreferences")}</h2>
              
              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("browserSettings")}</h3>
              <p className="mb-3">{t("browserSettingsText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("browserItem1")}</li>
                <li>{t("browserItem2")}</li>
                <li>{t("browserItem3")}</li>
                <li>{t("browserItem4")}</li>
                <li>{t("browserItem5")}</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("browserInstructions")}</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("impactOfDisabling")}</h2>
              <p className="mb-3">{t("impactText")}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t("impactItem1")}</li>
                <li>{t("impactItem2")}</li>
                <li>{t("impactItem3")}</li>
                <li>{t("impactItem4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("thirdPartyCookies")}</h2>
              <p>{t("thirdPartyCookiesText")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("cookieDuration")}</h2>
              
              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("sessionCookies")}</h3>
              <p>{t("sessionCookiesText")}</p>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">{t("persistentCookies")}</h3>
              <p>{t("persistentCookiesText")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("updatesToPolicy")}</h2>
              <p>{t("updatesToPolicyText")}</p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">{t("contactUs")}</h2>
              <p>{t("contactUsText")}</p>
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
