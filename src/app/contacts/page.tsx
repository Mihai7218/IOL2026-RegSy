'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'

import { fetchContacts, upsertContacts } from '@/services/firebaseApi'
import { ContactForm, contactSchema } from '@/schemas/contact'

export default function ContactsPage() {
  const [showSecondary, setShowSecondary] = useState(false)

  const EMPTY_SECONDARY = {
          name: '',
          email: '',
          phone: '',
          whatsapp: '',
        }

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: {
      primary: { name: '', email: '', phone: '', whatsapp: '' },
      secondary: { name: '', email: '', phone: '', whatsapp: '' },
    },
  })

  const {
    formState: { errors, isValid },
  } = form

  useEffect(() => {
    fetchContacts().then(c => {
      if (!c) return
      setShowSecondary(!!c.secondary)

      form.reset({
        primary: {
          name: c.primary.name ?? '',
          email: c.primary.email ?? '',
          phone: c.primary.phone ?? '',
          whatsapp: c.primary.whatsapp ?? '',
        },
        secondary: {
          name: c.secondary?.name ?? '',
          email: c.secondary?.email ?? '',
          phone: c.secondary?.phone ?? '',
          whatsapp: c.secondary?.whatsapp ?? '',
        },
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(data: ContactForm) {
    try {
      const hasSecondary = Object.values(data.secondary ?? {}).some(
        v => v?.trim()
      )

      await upsertContacts({
        primary: {
          name: data.primary.name.trim(),
          email: data.primary.email.trim(),
          phone: data.primary.phone?.trim() ?? '',
          whatsapp: data.primary.whatsapp?.trim() ?? '',
        },
        secondary: hasSecondary
          ? {
              name: data.secondary?.name?.trim() ?? '',
              email: data.secondary?.email?.trim() ?? '',
              phone: data.secondary?.phone?.trim() ?? '',
              whatsapp: data.secondary?.whatsapp?.trim() ?? '',
            }
          : EMPTY_SECONDARY,
      } as any)

      toast.success('Contacts saved')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save contacts')
    }
  }

  return (
    <div className="space-y-4 px-10">
      <h1 className="text-xl font-semibold">Contacts</h1>

      <Card>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* PRIMARY */}
            <section>
              <div className="font-medium text-xl mt-6">Primary contact</div>
              <div className='font-small mb-6 text-sm text-muted-foreground'>This can be any person that will register the team(s) and do the payment, not necessarily the team leader accompanying the students.</div>
              <FieldGroup>
                <Field
                  name="primary.name"
                  label="Name *"
                  control={form.control}
                  error={errors.primary?.name?.message}
                />
                <Field
                  name="primary.email"
                  label="Email *"
                  control={form.control}
                  error={errors.primary?.email?.message}
                />
                <Field name="primary.phone" label="Telephone" control={form.control} />
                <Field name="primary.whatsapp" label="WhatsApp" control={form.control} />
              </FieldGroup>
            </section>

            {/* SECONDARY */}
            {!showSecondary && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSecondary(true)}
              >
                Add secondary contact
              </Button>
            )}

            {showSecondary && (
              <section>
                <div className="font-medium text-xl mb-2">Secondary contact</div>
                <FieldGroup>
                  <Field
                    name="secondary.name"
                    label="Name"
                    control={form.control}
                    error={errors.secondary?.name?.message}
                  />
                  <Field
                    name="secondary.email"
                    label="Email"
                    control={form.control}
                    error={errors.secondary?.email?.message}
                  />
                  <Field name="secondary.phone" label="Telephone" control={form.control} />
                  <Field name="secondary.whatsapp" label="WhatsApp" control={form.control} />
                </FieldGroup>
              </section>
            )}

            <Button type="submit" disabled={!isValid}>
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/* Reusable Field */
function Field({
  name,
  label,
  control,
  error,
}: {
  name: any
  label: string
  control: any
  error?: string
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <Label>{label}</Label>
          <Input {...field} />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}
    />
  )
}