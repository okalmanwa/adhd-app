'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthNav from '@/components/AuthNav';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import Image from 'next/image';

interface PasswordRequirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const passwordRequirements: PasswordRequirement[] = useMemo(() => [
    {
      label: 'At least 8 characters long',
      regex: /.{8,}/,
      met: false
    },
    {
      label: 'One uppercase letter',
      regex: /[A-Z]/,
      met: false
    },
    {
      label: 'One lowercase letter',
      regex: /[a-z]/,
      met: false
    },
    {
      label: 'One number',
      regex: /[0-9]/,
      met: false
    },
    {
      label: 'One special character (!@#$%^&*)',
      regex: /[!@#$%^&*]/,
      met: false
    }
  ], []);

  const validatedRequirements = useMemo(() => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
  }, [password, passwordRequirements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check if all requirements are met
    const allRequirementsMet = validatedRequirements.every(req => req.met);
    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('verification link')) {
          setSuccess(true);
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create account. Please try again.');
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
        <AuthNav />
        <div className="flex items-center justify-center min-h-screen p-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-xl text-center">
              <Mail className="w-16 h-16 text-mint-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-lavender-400 mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-300 mb-6">
                We've sent a verification link to {email}. Please check your inbox and click the link to complete your registration.
              </p>
              <Link
                href="/login"
                className="text-mint-400 hover:text-mint-300 font-medium transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="FocusQuest"
            width={120}
            height={120}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">FocusQuest</h1>
          <p className="text-gray-400 text-center">Start your adventure in productivity</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white placeholder-gray-400 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-white">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white placeholder-gray-400 transition-colors"
                placeholder="Create a password"
                required
              />
              <div className="mt-2 space-y-1">
                {validatedRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {requirement.met ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={requirement.met ? 'text-green-400' : 'text-red-400'}>
                      {requirement.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-white">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-mint-400 focus:outline-none text-white placeholder-gray-400 transition-colors"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-mint-400 to-purple-400 text-gray-900 font-semibold py-3 px-4 rounded-xl hover:from-mint-300 hover:to-purple-300 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Your Adventure
            </button>
          </form>

          <p className="mt-6 text-center text-sky-300">
            Already have an account?{' '}
            <Link href="/login" className="text-mint-400 hover:text-mint-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 