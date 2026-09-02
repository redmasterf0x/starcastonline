"use client"

import { useState } from "react"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SPONSORSHIP_PACKAGES, type SponsorshipPackage } from "@/lib/products"
import { createSponsorCheckout, type SponsorFormData } from "@/app/actions/stripe"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { Check, Upload, ArrowLeft, Star, Zap } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SponsorsPage() {
  const [step, setStep] = useState<"packages" | "form" | "checkout">("packages")
  const [selectedPackage, setSelectedPackage] = useState<SponsorshipPackage | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<SponsorFormData>>({})

  const handleSelectPackage = (pkg: SponsorshipPackage) => {
    setSelectedPackage(pkg)
    setFormData({ packageId: pkg.id })
    setStep("form")
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload to Vercel Blob (served by Vercel CDN, not Supabase egress)
      const uploadData = new FormData()
      uploadData.append("file", file)
      uploadData.append("folder", "sponsor-logos")

      const res = await fetch("/api/upload", { method: "POST", body: uploadData })
      if (!res.ok) throw new Error("Upload failed")

      const { url: publicUrl } = await res.json()
      setFormData((prev) => ({ ...prev, logoUrl: publicUrl }))
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedPackage) return

    setSubmitting(true)
    const form = e.currentTarget
    const data: SponsorFormData = {
      packageId: selectedPackage.id,
      companyName: (form.elements.namedItem("companyName") as HTMLInputElement).value,
      companyEmail: (form.elements.namedItem("companyEmail") as HTMLInputElement).value,
      contactName: (form.elements.namedItem("contactName") as HTMLInputElement).value,
      contactPhone: (form.elements.namedItem("contactPhone") as HTMLInputElement).value || undefined,
      websiteUrl: (form.elements.namedItem("websiteUrl") as HTMLInputElement).value || undefined,
      socialFacebook: (form.elements.namedItem("socialFacebook") as HTMLInputElement).value || undefined,
      socialInstagram: (form.elements.namedItem("socialInstagram") as HTMLInputElement).value || undefined,
      socialTwitter: (form.elements.namedItem("socialTwitter") as HTMLInputElement).value || undefined,
      socialLinkedin: (form.elements.namedItem("socialLinkedin") as HTMLInputElement).value || undefined,
      commercialUrl: (form.elements.namedItem("commercialUrl") as HTMLInputElement).value || undefined,
      logoUrl: formData.logoUrl,
    }

    const result = await createSponsorCheckout(data)
    setSubmitting(false)
    
    if (result.clientSecret) {
      setClientSecret(result.clientSecret)
      setStep("checkout")
    } else {
      alert(result.error || "Something went wrong")
    }
  }

  return (
    <div className="public-shell">
      <ResponsiveHeader currentPage="/sponsors" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-[#ea6f2a] text-sm font-semibold uppercase tracking-widest mb-2">Partner With Us</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#f5f7ff] mb-4">Sponsorship Packages</h1>
          <p className="text-[#9a9fc4] text-lg max-w-2xl mx-auto">
            Support local sports coverage and get your brand in front of engaged audiences across Topeka and Kansas.
          </p>
        </div>

        {/* Step 1: Package Selection */}
        {step === "packages" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SPONSORSHIP_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`media-card relative rounded-2xl p-6 ${
                  pkg.popular
                    ? "border-[#ea6f2a] bg-[#ea6f2a]/5"
                    : pkg.bestValue
                    ? "border-[#f2a04a] bg-[#f2a04a]/5"
                    : "border-[#20205a] bg-[#0c0c3f]/60"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-6 bg-[#ea6f2a] text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}
                {pkg.bestValue && (
                  <div className="absolute -top-3 left-6 bg-[#f2a04a] text-[#05052d] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Best Value
                  </div>
                )}

                <h3 className="text-xl font-bold text-[#f5f7ff] mb-2">{pkg.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#ea6f2a]">${pkg.priceInCents / 100}</span>
                </div>
                <p className="text-[#9a9fc4] text-sm mb-6">{pkg.description}</p>

                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#f5f7ff]">
                      <Check className="w-4 h-4 text-[#ea6f2a] mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPackage(pkg)}
                  className={`w-full ${
                    pkg.popular || pkg.bestValue
                      ? "bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
                      : "bg-[#20205a] hover:bg-[#2a2a66] text-[#f5f7ff]"
                  }`}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Company Info Form */}
        {step === "form" && selectedPackage && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep("packages")}
              className="flex items-center gap-2 text-[#9a9fc4] hover:text-[#f5f7ff] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to packages
            </button>

            <div className="rounded-2xl border border-[#20205a] bg-[#0c0c3f]/60 p-6 md:p-8">
              <div className="mb-6 pb-6 border-b border-[#20205a]">
                <p className="text-[#ea6f2a] text-sm font-semibold mb-1">Selected Package</p>
                <h2 className="text-2xl font-bold text-[#f5f7ff]">{selectedPackage.name}</h2>
                <p className="text-[#9a9fc4]">${selectedPackage.priceInCents / 100}</p>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-6">
                <h3 className="text-lg font-semibold text-[#f5f7ff]">Company Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className="text-[#9a9fc4]">Company Name *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      required
                      className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      placeholder="Your Company LLC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail" className="text-[#9a9fc4]">Company Email *</Label>
                    <Input
                      id="companyEmail"
                      name="companyEmail"
                      type="email"
                      required
                      className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      placeholder="contact@yourcompany.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName" className="text-[#9a9fc4]">Contact Name *</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      required
                      className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone" className="text-[#9a9fc4]">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="websiteUrl" className="text-[#9a9fc4]">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="url"
                    className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div className="pt-4 border-t border-[#20205a]">
                  <h3 className="text-lg font-semibold text-[#f5f7ff] mb-4">Social Media Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="socialFacebook" className="text-[#9a9fc4]">Facebook</Label>
                      <Input
                        id="socialFacebook"
                        name="socialFacebook"
                        className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                        placeholder="facebook.com/yourcompany"
                      />
                    </div>
                    <div>
                      <Label htmlFor="socialInstagram" className="text-[#9a9fc4]">Instagram</Label>
                      <Input
                        id="socialInstagram"
                        name="socialInstagram"
                        className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                        placeholder="@yourcompany"
                      />
                    </div>
                    <div>
                      <Label htmlFor="socialTwitter" className="text-[#9a9fc4]">Twitter / X</Label>
                      <Input
                        id="socialTwitter"
                        name="socialTwitter"
                        className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                        placeholder="@yourcompany"
                      />
                    </div>
                    <div>
                      <Label htmlFor="socialLinkedin" className="text-[#9a9fc4]">LinkedIn</Label>
                      <Input
                        id="socialLinkedin"
                        name="socialLinkedin"
                        className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                        placeholder="linkedin.com/company/yourcompany"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#20205a]">
                  <h3 className="text-lg font-semibold text-[#f5f7ff] mb-4">Media Assets</h3>

                  <div className="mb-4">
                    <Label htmlFor="commercialUrl" className="text-[#9a9fc4]">Commercial Video URL</Label>
                    <Input
                      id="commercialUrl"
                      name="commercialUrl"
                      type="url"
                      className="mt-1 bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      placeholder="https://youtube.com/watch?v=... or direct video link"
                    />
                    <p className="text-xs text-[#9a9fc4]/60 mt-1">Link to your existing commercial video if you have one</p>
                  </div>

                  <div>
                    <Label className="text-[#9a9fc4]">Company Logo</Label>
                    <div className="mt-1 flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-[#05052d] border border-[#20205a] rounded-lg cursor-pointer hover:border-[#ea6f2a]/50 transition-colors">
                        <Upload className="w-4 h-4 text-[#9a9fc4]" />
                        <span className="text-sm text-[#9a9fc4]">{uploading ? "Uploading..." : "Upload Logo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      {formData.logoUrl && (
                        <img src={formData.logoUrl} alt="Logo preview" className="h-10 w-10 object-contain rounded" />
                      )}
                    </div>
                    <p className="text-xs text-[#9a9fc4]/60 mt-1">PNG or JPG, recommended size 500x500px</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#ea6f2a] hover:bg-[#bc3f00] text-white py-6 text-lg disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Continue to Payment"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Stripe Checkout */}
        {step === "checkout" && clientSecret && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep("form")}
              className="flex items-center gap-2 text-[#9a9fc4] hover:text-[#f5f7ff] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to form
            </button>

            <div className="rounded-2xl border border-[#20205a] bg-white overflow-hidden">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <p className="text-[#9a9fc4]">
            Questions? Contact us at{" "}
            <a href="mailto:starcastlivemedia@gmail.com" className="text-[#ea6f2a] hover:text-[#f2a04a] transition-colors">
              starcastlivemedia@gmail.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
