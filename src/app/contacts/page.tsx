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
  const form = useForm<ContactForm & { secondary?: ContactForm }>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name_1: '',
      email_1: '',
      phone_1: '',
      whatsapp_1: '',
      name_2: '',
      email_2: '',
      phone_2: '',
      whatsapp_2: '',
    },
  })

  useEffect(() => {
    fetchContacts().then(cs => {
      const primary = cs.find(c => c.isPrimary) ?? { name_1:'', email_1:'', phone_1:'', whatsapp_1:''}
      form.reset(primary as any)
    })
  }, [])

  function onSubmit(data: z.infer<typeof contactSchema>) {
    console.log("Submitting data:", data);
    // toast("You submitted the following values:", {
    //   description: (
    //     <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
    //       <code>{JSON.stringify(data, null, 2)}</code>
    //     </pre>
    //   ),
    //   position: "bottom-right",
    //   classNames: {
    //     content: "flex flex-col gap-2",
    //   },
    //   style: {
    //     "--border-radius": "calc(var(--radius)  + 4px)",
    //   } as React.CSSProperties,
    // })
  }

  return (
    <div className='space-y-4 px-4'>
      
      <Card>
        <CardHeader>Contact</CardHeader>
        <CardContent>
          <form id="contact-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className='grid grid-cols-2 gap-4'>
              <FieldGroup>
                <Controller
                  name="name_1"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label>Name</Label>
                      <Input {...field} />
                    </div>
                  )}
                />
                <Controller
                  name="email_1"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label>Email</Label>
                      <Input {...field} />
                    </div>
                  )}
                />
                <Controller
                  name="phone_1"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label>Telephone</Label>
                      <Input {...field} />
                    </div>
                  )}
                />
                <Controller
                  name="whatsapp_1"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label>WhatsApp</Label>
                      <Input {...field} />
                    </div>
                  )}
                /> 
                <Controller
                  name="name_2"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label>Secondary Name</Label>
                      <Input {...field} />
                    </div>
                  )}
                /> 
                <Controller
                  name="email_2"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label>Secondary Email</Label>
                      <Input {...field} />
                    </div>
                  )}
                /> 
                <Controller
                  name="phone_2"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label>Secondary Telephone</Label>
                      <Input {...field} />
                    </div>
                  )}
                /> 
                <Controller
                  name="whatsapp_2"
                  control={form.control}
                  render={({ field }) => (
                    <div>
                      <Label>Secondary WhatsApp</Label>
                      <Input {...field} />
                    </div>
                  )}
                /> 
              </FieldGroup>
            </div>
            <Button type="submit" form="contact-form" className='mt-4'>Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
