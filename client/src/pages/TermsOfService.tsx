import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-8" data-testid="text-tos-title">Terms of Service</h1>
          
          <div className="space-y-6 text-sm sm:text-base text-muted-foreground">
            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Reoung Movies Flix, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">2. Use License</h2>
              <p className="mb-3">
                Permission is granted to temporarily access the materials (information or software) on Reoung Movies Flix for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on Reoung Movies Flix</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or mirror the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">3. Account Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">4. Content</h2>
              <p>
                All content provided on Reoung Movies Flix is for informational and entertainment purposes only. We make no representations as to the accuracy or completeness of any information on this site.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">5. Prohibited Activities</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any harmful or malicious code</li>
                <li>Collect or track personal information of others</li>
                <li>Engage in unauthorized framing or linking</li>
                <li>Interfere with or disrupt the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">6. Disclaimer</h2>
              <p>
                The materials on Reoung Movies Flix are provided on an 'as is' basis. Reoung Movies Flix makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">7. Limitations</h2>
              <p>
                In no event shall Reoung Movies Flix or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Reoung Movies Flix.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">8. Revisions</h2>
              <p>
                The materials appearing on Reoung Movies Flix could include technical, typographical, or photographic errors. Reoung Movies Flix does not warrant that any of the materials on its website are accurate, complete or current. Reoung Movies Flix may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">9. Termination</h2>
              <p>
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">10. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page. Your continued use of the service after such modifications will constitute acknowledgment and agreement of the modified terms.
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
