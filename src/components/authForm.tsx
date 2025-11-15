// src/features/auth/components/AuthForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";

import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  registerWithGoogle,
} from "@/services/authApi";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  invitation_code: z.string().min(1, "Invitation code is required"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type Mode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const handleLoginSuccess = () => {
    toast.success("Signed in successfully.");
    router.push("/");
  };

  const handleRegisterSuccess = (countryName?: string) => {
    toast.success(
      countryName
        ? `Registration successful. Country: ${countryName}`
        : "Registration successful."
    );
    router.push("/");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Portal</CardTitle>
        <CardDescription>
          Sign in to manage your country, or register with an invitation code.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="pt-4">
            <LoginPanel onSuccess={handleLoginSuccess} />
          </TabsContent>

          <TabsContent value="register" className="pt-4">
            <RegisterPanel onSuccess={handleRegisterSuccess} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

type LoginPanelProps = {
  onSuccess: () => void;
};

function LoginPanel({ onSuccess }: LoginPanelProps) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleEmailLogin(values: LoginValues) {
    const result = await loginWithEmail(values.email, values.password);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    onSuccess();
  }

  async function handleGoogleLogin() {
    const result = await loginWithGoogle();

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    onSuccess();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </div>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Password</Label>
                <Input type="password" autoComplete="current-password" {...field} />
              </div>
            )}
          />
        </FieldGroup>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in with email"}
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
      >
        Continue with Google
      </Button>
    </div>
  );
}

type RegisterPanelProps = {
  onSuccess: (countryName?: string) => void;
};

function RegisterPanel({ onSuccess }: RegisterPanelProps) {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
  invitation_code: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleEmailRegister(values: RegisterValues) {
    const result = await registerWithEmail(
      values.email,
      values.password,
  values.invitation_code
    );

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    onSuccess(result.data.country.countryName);
  }

  async function handleGoogleRegister() {
  const code = form.getValues("invitation_code");

    if (!code) {
      toast.error("Invitation code is required for registration.");
      return;
    }

    const result = await registerWithGoogle(code);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    onSuccess(result.data.country.countryName);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(handleEmailRegister)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="invitation_code"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Invitation code</Label>
                <Input placeholder="Enter your invitation code" autoCapitalize="characters" {...field} />
              </div>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Contact email</Label>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
              </div>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Password</Label>
                <Input type="password" autoComplete="new-password" {...field} />
              </div>
            )}
          />
        </FieldGroup>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register with email"}
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleRegister}
        disabled={isSubmitting}
      >
        Register with Google
      </Button>
    </div>
  );
}
