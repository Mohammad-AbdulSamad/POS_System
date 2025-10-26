// src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import { validateEmail, validatePassword } from '../../utils/validators';
import Input from '../common/Input';
import Button from '../common/Button';
import Checkbox from '../common/Checkbox';
import Alert from '../common/Alert';
import { Mail, Lock } from 'lucide-react';

/**
 * LoginForm Component
 * 
 * Login form with email/password validation and authentication.
 * Uses AuthContext for authentication state management.
 * 
 * @example
 * <LoginForm onSuccess={() => navigate('/dashboard')} />
 */

const LoginForm = ({ onSuccess, onForgotPassword }) => {
  const { login } = useAuth();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  /**
   * Handle input change
   */
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Validate password (simple check for login)
    const passwordError = validatePassword(formData.password, {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumber: false,
      requireSpecial: false,
    });
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * ✅ CRITICAL FIX: Prevent all default behaviors
   */
  const handleSubmit = async (e) => {
    // ✅ Stop ALL default form behaviors immediately
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔵 Form submitted');
    
    // Clear any previous errors
    setApiError('');

    // Validate form
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, attempting login...');
    setLoading(true);

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      console.log('✅ Login successful');
      toast.success('Login successful!');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // ✅ CRITICAL: Show error in form and as toast
      console.log('❌ Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      // Set the error state (this should persist now)
      setApiError(errorMessage);
      toast.error(errorMessage);
      
      console.log('Error set to:', errorMessage);
    } finally {
      setLoading(false);
      console.log('🔵 Login attempt complete');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4"
      // ✅ Additional safety: Prevent any accidental form action
      action="javascript:void(0);"
      method="post"
    >
      {/* API Error Alert */}
      {apiError && (
        <Alert variant="danger" closable onClose={() => setApiError('')}>
          {apiError}
        </Alert>
      )}

      {/* Demo Credentials Info */}
      <Alert variant="info" size="sm">
        <div className="text-xs space-y-1">
          <p className="font-semibold">Demo Credentials:</p>
          <p>Admin: admin@pos.com / Admin123</p>
          <p>Manager: manager@pos.com / Manager123</p>
          <p>Cashier: cashier@pos.com / Cashier123</p>
        </div>
      </Alert>

      {/* Email Input */}
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        leftIcon={Mail}
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        disabled={loading}
        required
        autoComplete="email"
      />

      {/* Password Input */}
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        leftIcon={Lock}
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        error={errors.password}
        disabled={loading}
        required
        autoComplete="current-password"
        // ✅ Prevent Enter key from submitting if handled elsewhere
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember me"
          checked={formData.rememberMe}
          onChange={(e) => handleChange('rememberMe', e.target.checked)}
          disabled={loading}
        />

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          disabled={loading}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account?{' '}
        <a
          href="/register"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Sign up
        </a>
      </p>
    </form>
  );
};

LoginForm.displayName = 'LoginForm';

export default LoginForm;

/**
 * Example Usage:
 * 
 * import LoginForm from '@/components/auth/LoginForm';
 * import { useNavigate } from 'react-router-dom';
 * 
 * // In LoginPage
 * function LoginPage() {
 *   const navigate = useNavigate();
 * 
 *   const handleSuccess = () => {
 *     navigate('/dashboard');
 *   };
 * 
 *   const handleForgotPassword = () => {
 *     navigate('/forgot-password');
 *   };
 * 
 *   return (
 *     <AuthLayout title="Sign In" subtitle="Welcome back to your POS system">
 *       <LoginForm 
 *         onSuccess={handleSuccess}
 *         onForgotPassword={handleForgotPassword}
 *       />
 *     </AuthLayout>
 *   );
 * }
 * 
 * // With custom redirect
 * function ModalLogin({ onClose }) {
 *   return (
 *     <Modal isOpen={true} onClose={onClose} title="Sign In">
 *       <LoginForm 
 *         onSuccess={() => {
 *           onClose();
 *           window.location.reload();
 *         }}
 *       />
 *     </Modal>
 *   );
 * }
 * 
 * // With toast notification
 * function LoginWithToast() {
 *   const toast = useToast();
 * 
 *   const handleSuccess = () => {
 *     toast.success('Welcome back!');
 *     setTimeout(() => {
 *       window.location.href = '/dashboard';
 *     }, 1000);
 *   };
 * 
 *   return <LoginForm onSuccess={handleSuccess} />;
 * }
 */