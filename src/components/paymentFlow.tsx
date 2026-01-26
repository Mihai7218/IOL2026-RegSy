"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  registrationDetailSchema,
  type RegistrationDetailValues,
  paymentConfirmationSchema,
  type PaymentConfirmationValues,
  PaymentStep,
} from "@/schemas/payment"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardContentFirst, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemTitle } from "@/components/ui/item"
import { calculatePricing, decideCountryStatus, decidePlan } from "@/lib/payment"
import { useAuth } from "@/context/AuthProvider"
import { saveRegistrationDetails, submitPaymentConfirmation, loadPaymentState } from "@/services/paymenApi"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Images from "next/image"
import { toast } from "sonner"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export default function PaymentFlow() {
  const { claims } = useAuth()
  const [step, setStep] = useState<PaymentStep>(PaymentStep.RegistrationDetail)
  const [savedRegistration, setSavedRegistration] = useState<RegistrationDetailValues | null>(null)
  const [savedConfirmation, setSavedConfirmation] = useState<PaymentConfirmationValues | null>(null)

  // Decide plan and country status automatically
  const fixedPlan = decidePlan(new Date())
  const fixedCountryStatus = decideCountryStatus(claims?.countryKey)

  // Step 1 form
  const regForm = useForm<RegistrationDetailValues>({
    resolver: zodResolver(registrationDetailSchema),
    defaultValues: {
      plan: fixedPlan,
      country_status: fixedCountryStatus,
      number_of_teams: 1,
      additional_observers: fixedCountryStatus === "Future Host" ? 1 : 0,
      paid_before: 0,
      single_room_requests: 0,
    },
  })

  let watchedValuesRaw = regForm.watch()
  watchedValuesRaw["paid_before"] = savedRegistration?.paid_before ?? 0
  const watchedValues = watchedValuesRaw
  // Pricing preview for callout
  const breakdown = useMemo(() => calculatePricing(watchedValues), [watchedValues])

  // Step 2 form
  const [ack, setAck] = useState(false)
  const confirmForm = useForm<PaymentConfirmationValues>({
    resolver: zodResolver(paymentConfirmationSchema),
    defaultValues: {
      transaction_number: "",
      order_number: "",
      need_invoice: false,
      proof_of_payment_url: "",
    },
  })

  const [uploading, setUploading] = useState(false)

  async function handleFileUpload(file: File) {
    if (!file) return null
    
    setUploading(true)
    try {
      const { auth } = await import("@/lib/firebase")
      const user = auth.currentUser
      if (!user) throw new Error("Not authenticated")
      
      // Create a unique filename
      const timestamp = Date.now()
      const filename = `payment-proofs/${user.displayName}/${timestamp}_${file.name}`
      const storageRef = ref(storage, filename)
      
      // Upload file
      await uploadBytes(storageRef, file)
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)
      
      // Update form with URL
      confirmForm.setValue("proof_of_payment_url", downloadURL)
      
      toast.success("File uploaded successfully")
      return downloadURL
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to upload file")
      return null
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    // keep plan/country status fixed
    regForm.setValue("plan", fixedPlan)
    regForm.setValue("country_status", fixedCountryStatus)
  }, [fixedPlan, fixedCountryStatus, regForm])

  // Update country status when claims change
  useEffect(() => {
    if (claims?.countryKey) {
      const newStatus = decideCountryStatus(claims.countryKey)
      regForm.setValue("country_status", newStatus)
    }
  }, [claims?.countryKey, regForm])

  // Load any existing payment state so user resumes from last step
  useEffect(() => {
    ;(async () => {
      const state = await loadPaymentState()
      if (!state) return

      if (state.registration) {
        const reg = state.registration as RegistrationDetailValues
        regForm.reset(reg)
        setSavedRegistration(reg)
      }

      if (state.confirmation) {
        const conf = state.confirmation as PaymentConfirmationValues
        confirmForm.reset(conf)
        setSavedConfirmation(conf)
      }

      if (typeof state.step === "number") {
        setStep(state.step as PaymentStep)
      }
    })()
  }, [regForm, confirmForm])

  async function onSaveRegistration() {
    const values = regForm.getValues()
    // validate before showing dialog confirm
    const valid = await regForm.trigger()
    if (!valid) return
    setConfirmOpen(true)
  }

  const [confirmOpen, setConfirmOpen] = useState(false)

  async function confirmAndUpload() {
    try {
      const values = regForm.getValues()
      const totals = breakdown
      await saveRegistrationDetails(
        values,
        {
          subtotal: totals.subtotal,
          totalBank: totals.totalBank,
        },
        PaymentStep.PaymentConfirmation,
      )
      setSavedRegistration(values)
      setConfirmOpen(false)
      setStep(PaymentStep.PaymentConfirmation)
      toast.success("Registration details saved")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save registration details")
    }
  }

  async function onSubmitConfirmation(values: PaymentConfirmationValues) {
    try {
      const totals = breakdown
      await submitPaymentConfirmation(
        values,
        {
          subtotal: totals.subtotal,
          totalBank: totals.totalBank,
        },
        PaymentStep.WaitingForVerification,
      )
      setSavedConfirmation(values)
      setStep(PaymentStep.WaitingForVerification)
      toast.success("Payment submitted")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to submit payment")
    }
  }

  function finishAll() {
    setStep(PaymentStep.PaymentCompleted)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Payment</h1>
        <p className="text-muted-foreground mt-1">Please follow the steps to complete your payment.</p>
      </div>

      {/* Step navigator arrows */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === PaymentStep.RegistrationDetail}
          className="gap-2"
          aria-label="Previous step"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.min(PaymentStep.PaymentCompleted, s + 1))}
          disabled={step === PaymentStep.PaymentCompleted}
          className="gap-2"
          aria-label="Next step"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress lines (hide when completed) */}
      {step !== PaymentStep.PaymentCompleted && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1 rounded ${step >= i ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 text-sm text-muted-foreground">
            <div>
              <div className="font-medium">Step 1.</div>
              <div>Fill in Registration Detail</div>
            </div>
            <div>
              <div className="font-medium">Step 2.</div>
              <div>Proceed to Payment</div>
            </div>
            <div>
              <div className="font-medium">Step 3.</div>
              <div>Wait for Confirmation</div>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      {step === PaymentStep.RegistrationDetail && (
        <section className="space-y-6">
          {/* NOTES */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">NOTES</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Plan and Country Status are auto-determined and cannot be changed.</li>
                <li>Prices shown are estimates. Final charges may vary based on verification.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Image placeholders */}
        <div className="grid grid-cols-1">
            <div className="rounded-md border">
                <Images
                    src="/images/misc/prices.png"
                    width={2880} height={585}
                    alt="Pricing general"
                    className="w-full h-full"
                />
            </div>
        </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: Registration Detail form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Registration Detail</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <FieldGroup>
                    <div>
                      <FieldLabel>Plan</FieldLabel>
                      <Input value={regForm.watch("plan")} disabled readOnly />
                    </div>
                    <div>
                      <FieldLabel>Country Status</FieldLabel>
                      <Input value={regForm.watch("country_status")} disabled readOnly />
                    </div>
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      control={regForm.control}
                      name="number_of_teams"
                      render={({ field }) => (
                        <div>
                          <Label>Number of teams</Label>
                          <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              {regForm.watch("country_status") != "Not accredited" && <SelectItem value="2">2</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                    <Controller
                      control={regForm.control}
                      name="additional_observers"
                      render={({ field }) => (
                        <div>
                          <Label>Additional observers</Label>
                          <Input type="number" 
                            placeholder={regForm.watch("country_status") === "Future Host" ? "1" : "0"} 
                            min={regForm.watch("country_status") === "Future Host" ? 1 : 0} {...field} />
                        </div>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      control={regForm.control}
                      name="single_room_requests"
                      render={({ field }) => (
                        <div>
                          <Label>Single room requests</Label>
                          <Input type="number" placeholder="0" min={0} {...field} />
                        </div>
                      )}
                    />
                  </FieldGroup>

                  <div className="flex gap-3">
                    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" onClick={onSaveRegistration}>
                          Save
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm registration details</DialogTitle>
                          <DialogDescription>Review your details below. Continue to upload and proceed to payment?</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Plan:</span> {regForm.watch("plan")}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Country Status:</span> {regForm.watch("country_status")}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Teams:</span> {regForm.watch("number_of_teams")}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Additional observers:</span> {regForm.watch("additional_observers")}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Single room:</span> {regForm.watch("single_room_requests")}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                          <Button onClick={confirmAndUpload}>Yes, upload</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Right: price callout */}
            <Card className="hidden lg:block bg-gray-100 p-2">
              <CardHeader>
                <CardTitle className="text-base">Pricing Summary</CardTitle>
              </CardHeader>
              <CardContent className=" space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Original plan price (per 1st team)</span>
                  <span>{breakdown.planBaseFirstTeam} lei</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Adjusted 1st team</span>
                  <span>{breakdown.firstTeamAfterAdjustments} lei</span>
                </div>
                <div className="flex justify-between">
                  <span>Teams cost</span>
                  <span>{breakdown.teamsCost} lei</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional observers</span>
                  <span>{breakdown.observersCost} lei</span>
                </div>
                <div className="flex justify-between">
                  <span>Single room requests</span>
                  <span>{breakdown.singleRoomsCost} lei</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{breakdown.subtotal} lei</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid before</span>
                  <span>{breakdown.paid_before} lei</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{breakdown.totalBank} lei</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {step === PaymentStep.PaymentConfirmation && (
        <section className="space-y-6">
          <h2 className="text-base font-semibold">Please follow the payment instructions below.</h2>

          {/* Consent checkbox */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={ack} onCheckedChange={(v) => setAck(Boolean(v))} />
            <span>I understand and consent that all payments are non-refundable.</span>
          </label>

          {ack && (
            <Card>
              <CardContent className="pt-6">
                <form
                  className="space-y-6"
                  onSubmit={confirmForm.handleSubmit((v) => {
                    onSubmitConfirmation(v)
                  })}
                >

                  {/* Instructions */}
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-sm">Payment instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>Transfer the total amount to the following bank account:</p>
                        <ul className="list-disc pl-6">
                          <li>Beneficiary: ASOCIAȚIA ALUMNI A UNIVERSITĂȚII DIN BUCUREȘTI</li>
                          <li>Address: B-dul Regina Elisabeta, nr. 4-12,et. Subsol, Ap.Sala M 6, Bucureşti, Sector 3</li>
                          <li>IBAN: RO52BRDE410SV57544994100</li>
                          <li>CUI: 29223620</li>
                          <li>Bank: BRD, Compozitorilor Branch</li>
                          <li>SWIFT: BRDEROBU</li>
                        </ul>
                        <p>Include your country in the transfer remark. Keep the transaction/reference number.</p>
                        <p className="font-semibold">Please ensure that you cover all transaction fees.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    {/* Show totals with and without processing fee */}
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{breakdown.subtotal} lei</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid before</span>
                        <span>{breakdown.paid_before} lei</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span>{breakdown.totalBank} lei</span>
                      </div>
                    </div>

                  <FieldGroup>
                    <div>
                      <Controller
                        control={confirmForm.control}
                        name="transaction_number"
                        render={({ field }) => (
                          <div>
                            <Label>Transaction/Reference number *</Label>
                            <Input placeholder="Enter transaction/reference number" {...field} />
                            {confirmForm.formState.errors.transaction_number && (
                              <FieldError errors={[confirmForm.formState.errors.transaction_number]} />
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </FieldGroup>
                    
                  <FieldGroup>
                    <div>
                      <Label>Proof of payment *</Label>
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            await handleFileUpload(file)
                          }
                        }}
                        disabled={uploading}
                      />
                      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                      {confirmForm.watch("proof_of_payment_url") && !uploading && (
                        <p className="text-sm text-green-600">✓ File uploaded</p>
                      )}
                      {confirmForm.formState.errors.proof_of_payment_url && (
                        <FieldError errors={[confirmForm.formState.errors.proof_of_payment_url]} />
                      )}
                    </div>
                  </FieldGroup>

                  <div className="flex items-center gap-2">
                    <Controller
                      control={confirmForm.control}
                      name="need_invoice"
                      render={({ field }) => (
                        <>
                          <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                          <Label>Need invoice</Label>
                        </>
                      )}
                    />
                  </div>

                  {confirmForm.watch('need_invoice') && (
                    <Card>
                      <CardContentFirst className="text-sm text-muted-foreground">
                        <div className="space-y-1">
                          If you require an invoice, please send an email to <a href="mailto:iol2026ro@gmail.com">iol2026ro@gmail.com</a> with the following details:
                          <ul className="list-disc pl-6">
                            <li>Name of the institution</li>
                            <li>Full postal address (street, number, zipcode, city)</li>
                            <li>Tax number</li>
                            <li>Phone number</li>
                            <li>Person who should receive the invoice</li>
                          </ul>
                        </div>
                      </CardContentFirst>
                    </Card>
                  )}

                    <div className="flex gap-3">
                      <Button type="submit">Submit payment</Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {step === PaymentStep.WaitingForVerification && (
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wait for Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Your payment has been submitted successfully. We will verify your payment shortly.
              </div>

                <ItemGroup>
                <Item variant="outline" className="overflow-visible">
                  <ItemHeader>
                  <ItemTitle>Transaction details</ItemTitle>
                  </ItemHeader>
                  <ItemContent>
                    {savedRegistration && savedConfirmation ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {savedConfirmation.order_number && (
                      <div className="break-words">
                        <span className="text-muted-foreground">Order number:</span>{" "}
                        {savedConfirmation.order_number}
                      </div>
                      )}
                      {savedConfirmation.transaction_number && (
                      <div className="break-words">
                        <span className="text-muted-foreground">Transaction/Reference number:</span>{" "}
                        {savedConfirmation.transaction_number}
                      </div>
                      )}
                      <div className="break-words">
                      <span className="text-muted-foreground">Need invoice:</span>{" "}
                      {savedConfirmation.need_invoice ? "Yes" : "No"}
                      </div>
                      {savedConfirmation.proof_of_payment_url && (
                        <div className="break-words col-span-2">
                          <span className="text-muted-foreground">Proof of payment:</span>{" "}
                          <a
                            href={savedConfirmation.proof_of_payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:no-underline"
                          >
                            View document
                          </a>
                        </div>
                      )}
                      <div className="break-words">
                      <span className="text-muted-foreground">Plan:</span> {savedRegistration.plan}
                      </div>
                      <div className="break-words">
                      <span className="text-muted-foreground">Country status:</span>{" "}
                      {savedRegistration.country_status}
                      </div>
                      <div className="break-words">
                      <span className="text-muted-foreground">Teams:</span>{" "}
                      {savedRegistration.number_of_teams}
                      </div>
                      <div className="break-words">
                      <span className="text-muted-foreground">Observers:</span>{" "}
                      {savedRegistration.additional_observers}
                      </div>
                      <div className="break-words">
                      <span className="text-muted-foreground">Single room:</span>{" "}
                      {savedRegistration.single_room_requests}
                      </div>
                    </div>
                    ) : (
                    <div className="text-muted-foreground">
                      No transaction details yet. This is a preview of the confirmation step.
                    </div>
                    )}
                  </ItemContent>
                </Item>
                </ItemGroup>

              <div className="flex gap-3">
                <Button onClick={finishAll}>Finish</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {step === PaymentStep.PaymentCompleted && (
        <section>
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Payment complete</h3>
                <p className="text-muted-foreground mt-2">Thank you. Your registration and payment have been submitted. We will contact you after verification.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
