import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAppDispatch } from "@/app/hooks";
import { setUser, setToken } from "@/features/auth/authSlice";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";
import { api } from "@/lib/apiClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { ShieldAlert, Lock, Mail, ArrowRight, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loginLoading, setLoginLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@authority.gov.in",
      password: "AdminPassword123!",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setLoginLoading(true);
    try {
      const response = await api.post("/auth/admin-login", values);
      const data = response.data?.data;
      if (data?.user) {
        dispatch(setUser(data.user));
        dispatch(setToken(data.accessToken));
        toast.success(`Welcome ${data.user.name}! Authority authenticated.`);
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Authentication failed. Please verify authority credentials.";
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-900 text-slate-100 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 size-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Top Indian tricolor bar */}
          <div className="flex h-1.5 w-24 rounded-full overflow-hidden shadow-xs">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/30">
              <ShieldAlert className="size-6 text-amber-300" />
            </div>
            <div className="text-left">
              <h1 className="font-extrabold text-xl tracking-tight text-white block leading-tight">
                Department Authority
              </h1>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                Central Civic Operations Command
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xs font-medium">
            Restricted Administrative Portal for Department Heads, Zonal Officers & Field Engineers
          </p>
        </div>

        {/* Card */}
        <Card className="border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg font-bold text-white">Authority Authentication</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Sign in with your department credentials to manage civic operations, assign officers & submit Action Taken Reports
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-300">
                        Official Service Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 size-4 text-slate-500" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="officer@authority.gov.in"
                            autoComplete="email"
                            className="pl-9 text-sm bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-300">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 size-4 text-slate-500" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="pl-9 text-sm bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Security Restriction Warning Box */}
                <div className="p-2.5 rounded-lg bg-blue-950/50 border border-blue-800/60 text-[11px] text-blue-300 flex items-start gap-2">
                  <ShieldAlert className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Official Notice:</strong> Unauthorized access attempts are monitored and recorded. Regular citizens should use the public portal.
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-10 shadow-md text-xs sm:text-sm"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Spinner className="mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Access Authority Console <ArrowRight className="size-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-800 py-3.5 text-center text-xs text-slate-400 bg-slate-900/40">
            <span>Official Admin Access: </span>
            <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
              admin@authority.gov.in
            </code>
          </CardFooter>
        </Card>

        {/* Return to Public Portal */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Public Citizen Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
