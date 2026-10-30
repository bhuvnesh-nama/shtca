import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAppDispatch } from "@/app/hooks";
import { loginUser } from "@/features/auth/authThunk";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";

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
import { Mail, Lock, Building2, ArrowRight } from "lucide-react";

interface AuthErrorPayload {
  message?: string;
  data?: {
    message?: string;
  };
}

function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loginLoading, setLoginLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setLoginLoading(true);
    try {
      await dispatch(loginUser(values)).unwrap();
      navigate("/");
      toast.success("Welcome back! Signed in successfully.");
    } catch (error: unknown) {
      const err = error as AuthErrorPayload;
      const errorMessage =
        err?.message ||
        err?.data?.message ||
        "Invalid email or password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20 relative">
      {/* Background ambient glow matching theme */}
      <div className="absolute top-1/4 size-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Top Indian tricolor bar */}
          <div className="flex h-1.5 w-24 rounded-full overflow-hidden shadow-xs">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#003366] text-white shadow-md group-hover:scale-105 transition-transform">
              <Building2 className="size-6 text-amber-400" />
            </div>
            <div className="text-left">
              <span className="font-bold text-xl tracking-tight text-foreground block leading-tight">
                CivicDesk <span className="text-[#003366] dark:text-blue-400">Portal</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Citizen Grievance Redressal
              </span>
            </div>
          </Link>
          <p className="text-xs text-muted-foreground max-w-xs font-medium">
            Central Public Grievance Registration & Redressal System
          </p>
        </div>

        {/* Card */}
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">Citizen Sign In</CardTitle>
            <CardDescription className="text-xs">
              Sign in to register public grievances, upvote issues, and track Action Taken Reports (ATR)
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
                      <FormLabel className="text-xs font-semibold">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="citizen@gmail.com"
                            autoComplete="email"
                            className="pl-9 text-sm"
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold">Password</FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="pl-9 text-sm"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#003366] hover:bg-[#002244] text-white font-semibold h-10 shadow-sm text-xs sm:text-sm"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Spinner className="mr-2" />
                      Signing In...
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Sign In as Citizen <ArrowRight className="size-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t py-3.5 text-center text-xs text-muted-foreground bg-muted/10">
            <div>
              New citizen user?{" "}
              <Link
                to="/register"
                className="ml-1 font-semibold text-[#003366] dark:text-blue-400 hover:underline"
              >
                Register Citizen Account
              </Link>
            </div>
            <div className="pt-2 border-t border-border/60 w-full">
              <Link
                to="/admin/login"
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Department Authority or Officer? Authority Sign In →
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Back to map link */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            ← Return to public incident map
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
