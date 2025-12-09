import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-8" data-testid="text-privacy-title">Privacy Policy</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-muted-foreground">
            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p>
                Reoung Movies Flix ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our streaming service.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">Personal Information</h3>
              <p className="mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Full name</li>
                <li>Phone number</li>
                <li>Account preferences</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-3 mt-4">Usage Information</h3>
              <p className="mb-3">We automatically collect certain information about your device and how you interact with our service:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Viewing history and preferences</li>
                <li>Search queries</li>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your registration and manage your account</li>
                <li>Personalize your experience and provide recommendations</li>
                <li>Communicate with you about services, updates, and promotional offers</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">4. Information Sharing and Disclosure</h2>
              <p className="mb-3">We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
                <li><strong>With Your Consent:</strong> When you have given us permission to share your information</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">6. Your Rights and Choices</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account</li>
                <li>Opt-out of marketing communications</li>
                <li>Control cookie preferences</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">7. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings. For more information, please see our Cookie Preferences page.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
              <p>
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and maintained on servers located outside of your country where data protection laws may differ. By using our service, you consent to the transfer of your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">10. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">11. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through our website.
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
