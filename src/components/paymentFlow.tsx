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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { saveRegistrationDetails } from "@/services/paymenApi"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Images from "next/image"

type PaymentMethodOption = "Online Payment Platform" | "Direct Bank Transfer"

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
      additional_observers: 0,
      role_of_observer: "",
      single_room_requests: 0,
    },
  })

  // Pricing preview for callout
  const breakdown = useMemo(() => calculatePricing(regForm.getValues()), [regForm.watch()])

  // Step 2 form
  const [ack, setAck] = useState(false)
  const [method, setMethod] = useState<PaymentMethodOption | undefined>(undefined)
  const confirmForm = useForm<PaymentConfirmationValues>({
    resolver: zodResolver(paymentConfirmationSchema),
    defaultValues: {
      payment_method: "",
      transaction_number: "",
      order_number: "",
      need_invoice: false,
    },
  })

  useEffect(() => {
    // keep plan/country status fixed
    regForm.setValue("plan", fixedPlan)
    regForm.setValue("country_status", fixedCountryStatus)
  }, [fixedPlan, fixedCountryStatus, regForm])

  async function onSaveRegistration() {
    const values = regForm.getValues()
    // validate before showing dialog confirm
    const valid = await regForm.trigger()
    if (!valid) return
    setConfirmOpen(true)
  }

  const [confirmOpen, setConfirmOpen] = useState(false)

  async function confirmAndUpload() {
    const values = regForm.getValues()
    await saveRegistrationDetails(values)
    setSavedRegistration(values)
    setConfirmOpen(false)
    setStep(PaymentStep.PaymentConfirmation)
  }

  function onSubmitConfirmation(values: PaymentConfirmationValues) {
    setSavedConfirmation(values)
    setStep(PaymentStep.WaitingForVerification)
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border">
                <Images
                    src="/images/misc/prices_general.png"
                    width={820} height={283}
                    alt="Pricing general"
                    className="w-full h-full"
                />
            </div>
            <div className="rounded-md border">
                <Images
                    src="/images/misc/prices_previous_host.png"
                    width={820} height={283}
                    alt="Pricing previous host"
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
                              <SelectItem value="2">2</SelectItem>
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
                          <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 1, 2].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      control={regForm.control}
                      name="role_of_observer"
                      render={({ field }) => (
                        <div>
                          <Label>Role of observer</Label>
                          <Input placeholder="Enter role" {...field} />
                        </div>
                      )}
                    />
                    <Controller
                      control={regForm.control}
                      name="single_room_requests"
                      render={({ field }) => (
                        <div>
                          <Label>Single room requests</Label>
                          <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 1, 2, 3, 4, 5].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            <span className="text-muted-foreground">Observer role:</span> {regForm.watch("role_of_observer") || "—"}
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
                  <span>${breakdown.planBaseFirstTeam}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Adjusted 1st team</span>
                  <span>${breakdown.firstTeamAfterAdjustments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teams cost</span>
                  <span>${breakdown.teamsCost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional observers</span>
                  <span>${breakdown.observersCost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Single room requests</span>
                  <span>${breakdown.singleRoomsCost}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>${breakdown.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing fee (online only)</span>
                  <span>${breakdown.processingFeeOnline}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated total (online)</span>
                  <span>${breakdown.totalOnline}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated total (bank)</span>
                  <span>${breakdown.totalBank}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {step === PaymentStep.PaymentConfirmation && (
        <section className="space-y-6">
          <h2 className="text-base font-semibold">Please choose the payment method with descriptions below</h2>

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
                  <FieldGroup>
                    <div>
                      <Label>Payment method</Label>
                      <Select
                        value={method}
                        onValueChange={(v: PaymentMethodOption) => {
                          setMethod(v)
                          confirmForm.setValue("payment_method", v)
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Online Payment Platform">Online Payment Platform</SelectItem>
                          <SelectItem value="Direct Bank Transfer">Direct Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      {method === "Online Payment Platform" ? (
                        <Controller
                          control={confirmForm.control}
                          name="order_number"
                          render={({ field }) => (
                            <div>
                              <Label>Order number</Label>
                              <Input placeholder="Enter order number" {...field} />
                            </div>
                          )}
                        />
                      ) : method === "Direct Bank Transfer" ? (
                        <Controller
                          control={confirmForm.control}
                          name="transaction_number"
                          render={({ field }) => (
                            <div>
                              <Label>Transaction number</Label>
                              <Input placeholder="Enter transaction number" {...field} />
                            </div>
                          )}
                        />
                      ) : (
                        <div />
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

                  {/* Instructions */}
                  {method && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-sm">Payment instructions</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {method === "Online Payment Platform" ? (
                          <p>
                            You will be redirected to our secure payment platform to complete the payment. Keep the order
                            number for your records.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            <p>Transfer the total amount to the following bank account:</p>
                            <ul className="list-disc pl-6">
                              <li>Account Name: Example Org</li>
                              <li>Account No: 000-123-456</li>
                              <li>Bank: Example Bank, Main Branch</li>
                              <li>SWIFT: EXAMP123</li>
                            </ul>
                            <p>Include your country/team name in the transfer remark. Keep the transaction number.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-3">
                    <Button type="submit" disabled={!method}>Submit payment</Button>
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
                Your payment has been submitted successfully. Please check if an email with the transaction details is
                sent to your email account. We will verify your payment shortly.
              </div>

              <ItemGroup>
                <Item variant="outline">
                  <ItemHeader>
                    <ItemTitle>Transaction details</ItemTitle>
                  </ItemHeader>
                  <ItemContent>
                    <ItemDescription>
                      {savedRegistration && savedConfirmation ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <span className="text-muted-foreground">Payment method:</span> {savedConfirmation.payment_method}
                          </div>
                          {savedConfirmation.order_number && (
                            <div>
                              <span className="text-muted-foreground">Order number:</span> {savedConfirmation.order_number}
                            </div>
                          )}
                          {savedConfirmation.transaction_number && (
                            <div>
                              <span className="text-muted-foreground">Transaction number:</span> {savedConfirmation.transaction_number}
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Need invoice:</span> {savedConfirmation.need_invoice ? "Yes" : "No"}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Plan:</span> {savedRegistration.plan}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Country status:</span> {savedRegistration.country_status}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Teams:</span> {savedRegistration.number_of_teams}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Observers:</span> {savedRegistration.additional_observers}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Single room:</span> {savedRegistration.single_room_requests}
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No transaction details yet. This is a preview of the confirmation step.</div>
                      )}
                    </ItemDescription>
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
