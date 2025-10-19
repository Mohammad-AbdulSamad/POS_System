// src/components/layout/AuthLayout.jsx
import clsx from 'clsx';
import { Store, ArrowLeft } from 'lucide-react';

/**
 * AuthLayout Component
 * 
 * Layout for authentication pages (login, register, forgot password).
 * Centered card design with branding and consistent styling.
 * Matches the design system of MainLayout and other components.
 * 
 * @example
 * <AuthLayout title="Sign In">
 *   <LoginForm />
 * </AuthLayout>
 */

const AuthLayout = ({ 
  children,
  title,
  subtitle,
  showLogo = true,
  showFooter = true,
  showBackButton = false,
  backButtonText = 'Back',
  onBackClick,
  maxWidth = 'max-w-md',
  className = '',
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={clsx(
      'min-h-screen  min-w-screen flex flex-col',
      'bg-gray-50',
      className
    )}>
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo/Branding */}
        {showLogo && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="h-12 w-12 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg">
                <Store className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">POS System</h1>
            </div>
            {subtitle && (
              <p className="text-gray-600 text-sm">{subtitle}</p>
            )}
          </div>
        )}

        {/* Auth Card */}
        <div className={clsx(
          'w-full bg-white rounded-xl shadow-lg border border-gray-200',
          'p-8',
          maxWidth
        )}>
          {/* Back Button */}
          {showBackButton && (
            <button
              onClick={onBackClick || (() => window.history.back())}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backButtonText}</span>
            </button>
          )}

          {/* Title */}
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div>
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      {showFooter && (
        <footer className="py-6 px-4 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <p className="text-sm text-gray-600">
                © {currentYear} POS System. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="/terms" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </a>
                <span className="text-gray-300">•</span>
                <a 
                  href="/privacy" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </a>
                <span className="text-gray-300">•</span>
                <a 
                  href="/support" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;

/**
 * Example Usage:
 * 
 * import AuthLayout from '@/components/layout/AuthLayout';
 * import LoginForm from '@/components/auth/LoginForm';
 * import Input from '@/components/common/Input';
 * import Button from '@/components/common/Button';
 * import { Mail, Lock, User } from 'lucide-react';
 * import { useState } from 'react';
 * 
 * // Login Page
 * function LoginPage() {
 *   return (
 *     <AuthLayout 
 *       title="Sign In"
 *       subtitle="Welcome back to your POS system"
 *     >
 *       <LoginForm />
 *     </AuthLayout>
 *   );
 * }
 * 
 * // Register Page
 * function RegisterPage() {
 *   return (
 *     <AuthLayout 
 *       title="Create Account"
 *       subtitle="Get started with your POS system"
 *       maxWidth="max-w-lg"
 *     >
 *       <RegisterForm />
 *     </AuthLayout>
 *   );
 * }
 * 
 * // Forgot Password Page
 * function ForgotPasswordPage() {
 *   const [email, setEmail] = useState('');
 * 
 *   return (
 *     <AuthLayout 
 *       title="Forgot Password"
 *       subtitle="Enter your email to reset your password"
 *       showBackButton
 *       backButtonText="Back to login"
 *       onBackClick={() => window.location.href = '/login'}
 *     >
 *       <form className="space-y-4">
 *         <Input
 *           label="Email Address"
 *           type="email"
 *           placeholder="Enter your email"
 *           leftIcon={Mail}
 *           value={email}
 *           onChange={(e) => setEmail(e.target.value)}
 *           required
 *         />
 * 
 *         <Button type="submit" variant="primary" fullWidth>
 *           Send Reset Link
 *         </Button>
 *       </form>
 *     </AuthLayout>
 *   );
 * }
 * 
 * // Reset Password Page
 * function ResetPasswordPage() {
 *   const [password, setPassword] = useState('');
 *   const [confirmPassword, setConfirmPassword] = useState('');
 * 
 *   return (
 *     <AuthLayout 
 *       title="Reset Password"
 *       subtitle="Enter your new password"
 *     >
 *       <form className="space-y-4">
 *         <Input
 *           label="New Password"
 *           type="password"
 *           placeholder="Enter new password"
 *           leftIcon={Lock}
 *           value={password}
 *           onChange={(e) => setPassword(e.target.value)}
 *           helperText="Must be at least 8 characters"
 *           required
 *         />
 * 
 *         <Input
 *           label="Confirm Password"
 *           type="password"
 *           placeholder="Confirm new password"
 *           leftIcon={Lock}
 *           value={confirmPassword}
 *           onChange={(e) => setConfirmPassword(e.target.value)}
 *           required
 *         />
 * 
 *         <Button type="submit" variant="primary" fullWidth>
 *           Reset Password
 *         </Button>
 *       </form>
 *     </AuthLayout>
 *   );
 * }
 * 
 * // Email Verification Page
 * function VerifyEmailPage() {
 *   const [code, setCode] = useState('');
 * 
 *   return (
 *     <AuthLayout 
 *       title="Verify Your Email"
 *       subtitle="Enter the code we sent to your email"
 *     >
 *       <form className="space-y-4">
 *         <Input
 *           label="Verification Code"
 *           placeholder="Enter 6-digit code"
 *           value={code}
 *           onChange={(e) => setCode(e.target.value)}
 *           maxLength={6}
 *           required
 *         />
 * 
 *         <Button type="submit" variant="primary" fullWidth>
 *           Verify Email
 *         </Button>
 * 
 *         <p className="text-center text-sm text-gray-600 mt-4">
 *           Didn't receive the code?{' '}
 *           <button 
 *             type="button"
 *             className="text-primary-600 hover:text-primary-700 font-medium"
 *           >
 *             Resend
 *           </button>
 *         </p>
 *       </form>
 *     </AuthLayout>
 *   );
 * }
 * 
 * // Without logo (minimal)
 * <AuthLayout title="Sign In" showLogo={false}>
 *   <LoginForm />
 * </AuthLayout>
 * 
 * // Without footer
 * <AuthLayout title="Sign In" showFooter={false}>
 *   <LoginForm />
 * </AuthLayout>
 * 
 * // Custom max width
 * <AuthLayout title="Sign In" maxWidth="max-w-2xl">
 *   <ComplexForm />
 * </AuthLayout>
 * 
 * // Success/Confirmation Page
 * function EmailSentPage() {
 *   return (
 *     <AuthLayout 
 *       title="Check Your Email"
 *       showBackButton
 *       backButtonText="Back to login"
 *     >
 *       <div className="text-center py-4">
 *         <div className="h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
 *           <Mail className="h-8 w-8 text-success-600" />
 *         </div>
 *         <p className="text-sm text-gray-600 mb-6">
 *           We've sent a password reset link to your email address.
 *         </p>
 *         <Button variant="outline" fullWidth>
 *           Resend Email
 *         </Button>
 *       </div>
 *     </AuthLayout>
 *   );
 * }
 * 
 * // Two-Factor Authentication
 * function TwoFactorPage() {
 *   const [code, setCode] = useState('');
 * 
 *   return (
 *     <AuthLayout 
 *       title="Two-Factor Authentication"
 *       subtitle="Enter the code from your authenticator app"
 *       showBackButton
 *       maxWidth="max-w-sm"
 *     >
 *       <form className="space-y-4">
 *         <Input
 *           label="Authentication Code"
 *           placeholder="000000"
 *           value={code}
 *           onChange={(e) => setCode(e.target.value)}
 *           maxLength={6}
 *           className="text-center text-2xl tracking-widest"
 *           required
 *         />
 * 
 *         <Button type="submit" variant="primary" fullWidth>
 *           Verify
 *         </Button>
 * 
 *         <p className="text-center text-sm text-gray-600">
 *           <button 
 *             type="button"
 *             className="text-primary-600 hover:text-primary-700 font-medium"
 *           >
 *             Use recovery code instead
 *           </button>
 *         </p>
 *       </form>
 *     </AuthLayout>
 *   );
 * }
 */