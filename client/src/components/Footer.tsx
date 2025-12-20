import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Footer() {
  const footerLinks = {
    company: [
      { label: "អំពីយើង", href: "#" },
      { label: "ការងារ", href: "#" },
      { label: "ព័ត៌មានសារព័ត៌មាន", href: "#" },
    ],
    support: [
      { label: "មជ្ឈមណ្ឌលជំនួយ", href: "#" },
      { label: "ទាក់ទងយើង", href: "#" },
      { label: "លក្ខខណ្ឌសេវាកម្ម", href: "/terms" },
    ],
    legal: [
      { label: "គោលការណ៍ឯកជនភាព", href: "/privacy" },
      { label: "ចំណូលចិត្តខូឃី", href: "/cookies" },
      { label: "ព័ត៌មានក្រុមហ៊ុន", href: "#" },
    ],
  };

  return (
    <footer className="bg-background/50 border-t border-border mt-16" data-testid="footer">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4" data-testid="text-footer-heading-company">ក្រុមហ៊ុន</h3>
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
            <h3 className="font-semibold mb-4" data-testid="text-footer-heading-support">ជំនួយ</h3>
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
            <h3 className="font-semibold mb-4" data-testid="text-footer-heading-legal">ច្បាប់</h3>
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
            <h3 className="font-semibold mb-4" data-testid="text-footer-heading-social">តភ្ជាប់ជាមួយយើង</h3>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" data-testid="button-social-facebook">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" data-testid="button-social-twitter">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" data-testid="button-social-instagram">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" data-testid="button-social-youtube">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p data-testid="text-copyright">© 2024 Rueng VIP។ រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
        </div>
      </div>
    </footer>
  );
}
