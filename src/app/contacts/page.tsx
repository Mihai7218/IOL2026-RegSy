'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Controller, useForm } from 'react-hook-form'
import * as z from "zod"
import { toast } from "sonner"
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactForm, contactSchema } from '@/schemas/contact'
import { useEffect } from 'react'
import { fetchContacts, upsertContacts } from '@/services/firebaseApi'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

export default function ContactsPage() {
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      primary: { name: '', email: '', phone: '', whatsapp: '' },
      secondary: { name: '', email: '', phone: '', whatsapp: '' },
    },
  })

  useEffect(() => {
    fetchContacts().then((c) => {
      if (!c) return
      form.reset({
        primary: {
          name: c.primary.name ?? '',
          email: c.primary.email ?? '',
          phone: c.primary.phone ?? '',
          whatsapp: c.primary.whatsapp ?? '',
        },
        secondary: {
          name: c.secondary?.name ?? '',
          email: (c.secondary?.email as string | undefined) ?? '',
          phone: c.secondary?.phone ?? '',
          whatsapp: c.secondary?.whatsapp ?? '',
        },
      })
    })
    // `form` is stable from `useForm`, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(data: z.infer<typeof contactSchema>) {
    try {
      // Only include secondary if at least one field is provided
      const hasSecondary = [
        data.secondary?.name,
        data.secondary?.email,
        data.secondary?.phone,
        data.secondary?.whatsapp,
      ].some(v => (v ?? '').toString().trim() !== '')

      const payload: ContactForm = {
        primary: {
          name: data.primary.name.trim(),
          email: data.primary.email.trim(),
          phone: (data.primary.phone ?? '').trim(),
          // store empty string as empty string (never undefined) to avoid Firestore error
          whatsapp: (data.primary.whatsapp ?? '').trim(),
        },
        // Only include secondary if at least one field is provided; when included, normalise
        // empty strings to empty string so we never send `undefined` into Firestore.
        secondary: hasSecondary && data.secondary
          ? {
              name: (data.secondary.name ?? ' ').trim(),
              email: (data.secondary.email ?? ' ').trim(),
              phone: (data.secondary.phone ?? ' ').trim(),
              whatsapp: (data.secondary.whatsapp ?? ' ').trim(),
            }
          : undefined,
      }

      await upsertContacts(payload as any)
      toast.success('Contacts saved')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save contacts')
    }
  }

  return (
    <div className='space-y-4 px-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Contact</h1>
      </div>
      <Card>
        <CardContent>
          <form id="contact-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className='pt-4 space-y-6 pr-10'>
              <div>
                <div className='font-medium mb-2'>Primary contact</div>
                <FieldGroup>
                  <Controller
                    name="primary.name"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Name</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name="primary.email"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Email</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name="primary.phone"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Telephone</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name="primary.whatsapp"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>WhatsApp</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                </FieldGroup>
              </div>

              <div>
                <div className='font-medium mb-2'>Secondary contact</div>
                <FieldGroup>
                  <Controller
                    name="secondary.name"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Name</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name="secondary.email"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Email</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name="secondary.phone"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Telephone</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name="secondary.whatsapp"
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>WhatsApp</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                </FieldGroup>
              </div>
            </div>
            <Button type="submit" form="contact-form" className='mt-4'>Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
