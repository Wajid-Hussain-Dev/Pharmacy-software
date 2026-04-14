import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully');
    } catch (error: any) {
      console.error(error);
      toast.error('Login failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center text-blue-600 mb-4">
            <PlusCircle size={64} />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">PharmaFlow Pro</h2>
          <p className="mt-4 text-gray-600">
            Advanced Medical Store Management System
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <button
            onClick={handleLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg"
          >
            Sign in with Google
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Secure access for authorized pharmacy personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
