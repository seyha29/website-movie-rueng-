import { Facebook } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { footerLabels } from "@/lib/translations";

export default function Footer() {
  const { language } = useLanguage();
  const t = (key: keyof typeof footerLabels) => footerLabels[key][language];

  const footerLinks = {
    company: [
      { label: t("aboutUs"), href: "#" },
      { label: t("careers"), href: "#" },
      { label: t("press"), href: "#" },
    ],
    support: [
      { label: t("helpCenter"), href: "#" },
      { label: t("contactUs"), href: "#" },
      { label: t("termsOfService"), href: "/terms" },
    ],
    legal: [
      { label: t("privacyPolicy"), href: "/privacy" },
      { label: t("cookiePreferences"), href: "/cookies" },
      { label: t("corporateInfo"), href: "#" },
    ],
  };

  return (
    <footer className="bg-background/50 border-t border-border mt-16" data-testid="footer">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4" data-testid="text-footer-heading-company">{t("company")}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link href={link.href}>
                      <span
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4" data-testid="text-footer-heading-support">{t("support")}</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link href={link.href}>
                      <span
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4" data-testid="text-footer-heading-legal">{t("legal")}</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link href={link.href}>
                      <span
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4" data-testid="text-footer-heading-social">{t("connectWithUs")}</h3>
            <div className="flex gap-2">
              <a 
                href="https://www.facebook.com/ruengvip" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="icon" variant="ghost" data-testid="button-social-facebook">
                  <Facebook className="h-5 w-5" />
                </Button>
              </a>
              <a 
                href="https://t.me/ruengvip" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="icon" variant="ghost" data-testid="button-social-telegram">
                  <FaTelegram className="h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p data-testid="text-copyright">© 2024 Rueng VIP. {t("allRightsReserved")}.</p>
        </div>
      </div>
    </footer>
  );
}
