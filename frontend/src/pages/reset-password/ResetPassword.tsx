import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';

function ResetPassword() {
    const { token } = useParams();

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    async function resetPassword() {
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            await api.post(`/auth/reset-password/${token}`, { password })

            toast.success("Password reset successful");
            <Navigate to="/login" replace />
        } catch (error:any) {
            toast.error(error.response.data.message);
        }
    }
    
  return (
    <div className='grid gap-4 justify-center items-center h-screen'>
        <div className='bg-white p-8 rounded shadow-md w-[30rem] grid gap-4'>
            <h1 className='text-2xl font-bold'>Set New Password</h1>
            <div className='grid gap-4'>
                <Input onChange={(e:any) => setPassword(e.target.value)} type="password" placeholder="New Password" />
                <Input onChange={(e:any) => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm New Password" />
                <Button onClick={resetPassword}>Reset Password</Button>
            </div>
        </div>
    </div>
  )
}

export default ResetPassword