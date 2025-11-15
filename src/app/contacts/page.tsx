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
    fetchContacts().then(cs => {
      const p = cs.find(c => c.isPrimary)
      const s = cs.find(c => !c.isPrimary)
      form.reset({
        primary: {
          name: p?.name ?? '',
          email: p?.email ?? '',
          phone: p?.phone ?? '',
          whatsapp: p?.whatsapp ?? '',
        },
        secondary: {
          name: s?.name ?? '',
          email: s?.email ?? '',
          phone: s?.phone ?? '',
          whatsapp: s?.whatsapp ?? '',
        },
      })
    })
  }, [])

  async function onSubmit(data: z.infer<typeof contactSchema>) {
    try {
      const contacts = [] as Array<{
        name: string; email: string; phone: string; whatsapp?: string; isPrimary?: boolean
      }>

      // Always include primary
      contacts.push({
        name: data.primary.name.trim(),
        email: data.primary.email.trim(),
        phone: (data.primary.phone ?? '').trim(),
        whatsapp: (data.primary.whatsapp ?? '').trim() || undefined,
        isPrimary: true,
      })

      // Include secondary only if at least one field is provided
      const hasSecondary = [
        data.secondary?.name,
        data.secondary?.email,
        data.secondary?.phone,
        data.secondary?.whatsapp,
      ].some(v => (v ?? '').toString().trim() !== '')

      if (hasSecondary && data.secondary) {
        contacts.push({
          name: (data.secondary.name ?? '').trim(),
          email: (data.secondary.email ?? '').trim(),
          phone: (data.secondary.phone ?? '').trim(),
          whatsapp: (data.secondary.whatsapp ?? '').trim() || undefined,
          isPrimary: false,
        })
      }
      console.log('Submitting contacts:', contacts)
      await upsertContacts(contacts as any)
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
