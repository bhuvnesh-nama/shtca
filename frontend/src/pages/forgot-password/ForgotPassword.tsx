import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { Shield, Mail, ArrowRight } from "lucide-react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data?.message || "Reset link sent to your email!");
      navigate("/reset-password-email-sent");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20 relative">
      <div className="absolute top-1/4 size-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
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
            Account Access Recovery
          </p>
        </div>

        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">Reset Password</CardTitle>
            <CardDescription className="text-xs">
              Enter your registered resident email to receive a password reset link
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="resident@society.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 shadow-sm"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2" />
                    Sending link...
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Send Password Reset Link <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t py-4 text-center text-xs text-muted-foreground bg-muted/10">
            Remember your credentials?{" "}
            <Link
              to="/login"
              className="ml-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default ForgotPassword;
