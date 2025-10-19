// src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
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
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      
      // Call success callback
      onSuccess?.();
    } catch (error) {
      setApiError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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