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
import { Building2, User, Mail, Lock, Phone, MapPin, ArrowRight, ShieldCheck } from "lucide-react";

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
      phone: "",
      ward: "Ward 42 - Preet Vihar",
      password: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setRegisterLoading(true);
    try {
      const response = await api.post("/auth/register", values);
      toast.success(
        response.data?.message || "Citizen account registered successfully! Please sign in."
      );
      navigate("/login");
    } catch (error: unknown) {
      const err = error as RegisterErrorPayload;
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please check your information.";
      toast.error(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20 relative">
      <div className="absolute top-1/4 size-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-5">
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
              <span className="font-extrabold text-xl tracking-tight text-[#003366] dark:text-blue-400 block leading-tight">
                CivicDesk <span className="text-xs font-bold px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-950 text-[#003366] dark:text-blue-200 uppercase tracking-wider border border-blue-300 dark:border-blue-800 ml-1">Citizen</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Public Grievance Redressal Portal
              </span>
            </div>
          </Link>
          <p className="text-xs text-muted-foreground max-w-sm font-medium">
            Citizen Grievance Registration, Status Tracking & Zone Redressal
          </p>
        </div>

        {/* Card */}
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg sm:text-xl font-bold">Citizen Registration</CardTitle>
            <CardDescription className="text-xs">
              Create your citizen profile to lodge and track civic grievances
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Full Name <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="e.g. Rajesh Kumar"
                            autoComplete="name"
                            className="pl-9 text-sm"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mobile Number & Email in 2 columns on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Mobile Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="tel"
                              maxLength={10}
                              placeholder="9876543210"
                              autoComplete="tel"
                              className="pl-9 text-sm font-mono"
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
                        <FormLabel className="text-xs font-semibold">Email Address <span className="text-rose-500">*</span></FormLabel>
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
                </div>

                {/* Residential Ward */}
                <FormField
                  control={form.control}
                  name="ward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Zone / Residential Area</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                          <select
                            {...field}
                            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
                          >
                            <option value="Ward 42 - Preet Vihar">Zone 1 - East (Preet Vihar)</option>
                            <option value="Ward 18 - Connaught Place">Zone 2 - Central (Connaught Place)</option>
                            <option value="Ward 24 - Mayur Vihar">Zone 3 - East (Mayur Vihar)</option>
                            <option value="Ward 35 - Karol Bagh">Zone 4 - Central (Karol Bagh)</option>
                            <option value="Ward 14 - Anand Vihar">Zone 5 - East (Anand Vihar)</option>
                          </select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Password (minimum 6 characters) <span className="text-rose-500">*</span></FormLabel>
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

                {/* Security & Privacy Notice */}
                <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2">
                  <ShieldCheck className="size-4 text-[#003366] dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Official Civic Portal:</strong> Your contact details are strictly used for grievance tracking updates and field officer inspection.
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#003366] hover:bg-[#002244] text-white font-semibold h-10 shadow-sm text-xs sm:text-sm"
                  disabled={registerLoading}
                >
                  {registerLoading ? (
                    <>
                      <Spinner className="mr-2" />
                      Registering Account...
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Register Citizen Account <ArrowRight className="size-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="justify-center border-t py-3.5 text-center text-xs text-muted-foreground bg-muted/10">
            Already have an account?{" "}
            <Link
              to="/login"
              className="ml-1 font-semibold text-[#003366] dark:text-blue-400 hover:underline"
            >
              Sign In
            </Link>
          </CardFooter>
        </Card>

        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            ← Return to Public Citizen Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
