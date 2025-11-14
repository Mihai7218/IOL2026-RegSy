'use client'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const signin = async () => { await signInWithEmailAndPassword(auth, email, password) }
  const signGoogle = async () => { const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider) }
  return (
    <div className='h-screen w-screen grid place-content-center gap-3'>
      <Input placeholder='Email' value={email} onChange={e => setEmail(e.target.value)} />
      <Input placeholder='Password' type='password' value={password} onChange={e => setPassword(e.target.value)} />
      <Button onClick={signin}>Sign in</Button>
      <Button onClick={signGoogle}>Google</Button>
    </div>
  )
}
