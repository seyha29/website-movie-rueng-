import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function CookiePreferences() {
  const [, setLocation] = useLocation();

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
            Back
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-8" data-testid="text-cookies-title">Cookie Preferences</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-muted-foreground">
            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Types of Cookies We Use</h2>
              
              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">1. Essential Cookies</h3>
              <p className="mb-3">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Session management</li>
                <li>Authentication and security</li>
                <li>Load balancing</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">2. Functional Cookies</h3>
              <p className="mb-3">
                These cookies enable enhanced functionality and personalization, such as:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Remembering your preferences</li>
                <li>Language selection</li>
                <li>Video player settings</li>
                <li>Search history</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">3. Analytics Cookies</h3>
              <p className="mb-3">
                These cookies help us understand how visitors interact with our website by collecting and reporting information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Number of visitors</li>
                <li>Pages viewed</li>
                <li>Time spent on site</li>
                <li>Traffic sources</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">4. Performance Cookies</h3>
              <p className="mb-3">
                These cookies collect information about how you use our website to help us improve performance:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Video streaming quality</li>
                <li>Page load times</li>
                <li>Error monitoring</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">5. Targeting/Advertising Cookies</h3>
              <p className="mb-3">
                These cookies may be set through our site by advertising partners to build a profile of your interests:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Content recommendations</li>
                <li>Personalized advertising</li>
                <li>Marketing campaign effectiveness</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Managing Your Cookie Preferences</h2>
              
              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">Browser Settings</h3>
              <p className="mb-3">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>View cookies stored on your device</li>
                <li>Delete existing cookies</li>
                <li>Block all cookies</li>
                <li>Block third-party cookies</li>
                <li>Clear all cookies when you close your browser</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">Browser-Specific Instructions</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Impact of Disabling Cookies</h2>
              <p className="mb-3">
                Please note that blocking or deleting cookies may impact your experience on our website:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Some features may not work properly</li>
                <li>You may need to re-enter information</li>
                <li>Personalized recommendations may not be available</li>
                <li>Your preferences will not be saved</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Third-Party Cookies</h2>
              <p>
                We may use third-party services that set their own cookies. These third parties have their own privacy policies, and we do not have access to or control over their cookies. We recommend reviewing the privacy policies of these third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Cookie Duration</h2>
              
              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">Session Cookies</h3>
              <p>
                These are temporary cookies that expire when you close your browser.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">Persistent Cookies</h3>
              <p>
                These cookies remain on your device until they expire or you delete them. Their duration varies from a few days to several years.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Updates to Cookie Policy</h2>
              <p>
                We may update this Cookie Preferences page from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please contact us through our website.
              </p>
            </section>

            <section className="pt-6 border-t">
              <p className="text-xs">
                Last updated: November 8, 2025
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
