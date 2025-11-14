'use client'
import { ReactNode } from 'react'

export function Form({ children }: { children: ReactNode }) {
  return <form className='space-y-4'>{children}</form>
}
