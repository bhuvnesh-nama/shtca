import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { api } from "@/lib/apiClient";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";

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
import { Shield, User, Mail, Lock, ArrowRight } from "lucide-react";

interface RegisterErrorPayload {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

function Register() {
  const navigate = useNavigate();
  const [registerLoading, setRegisterLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setRegisterLoading(true);
    try {
      const response = await api.post("/auth/register", values);
      toast.success(
        response.data?.message || "Account registered! You can now sign in."
      );
      navigate("/login");
    } catch (error: unknown) {
      const err = error as RegisterErrorPayload;
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please check details.";
      toast.error(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20 relative">
      <div className="absolute top-1/4 size-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md group-hover:scale-105 transition-transform">
              <Shield className="size-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-foreground">
              Hyper<span className="text-blue-600">Net</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground max-w-xs font-medium">
            Hyperlocal Safety, Hazards & Community Corroboration Network
          </p>
        </div>

        {/* Card */}
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">Create Resident Account</CardTitle>
            <CardDescription className="text-xs">
              Join your apartment or neighbourhood network to report and track issues
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Full Name / Society Unit</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="e.g. Vikram Rao (Flat 402)"
                            autoComplete="name"
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
                            placeholder="vikram@society.org"
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
                      <FormLabel className="text-xs font-semibold">Password (min 6 characters)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 shadow-sm"
                  disabled={registerLoading}
                >
                  {registerLoading ? (
                    <>
                      <Spinner className="mr-2" />
                      Creating account...
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Create Resident Account <ArrowRight className="size-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="justify-center border-t py-4 text-center text-xs text-muted-foreground bg-muted/10">
            Already registered?{" "}
            <Link
              to="/login"
              className="ml-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign in to your account
            </Link>
          </CardFooter>
        </Card>

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

export default Register;
