// src/components/users/UserForm.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Alert from '../common/Alert';
import RoleSelector from './RoleSelector';
import { Save, X } from 'lucide-react';

const UserForm = ({
  initialData = null,
  branches = [],
  onSubmit,
  onCancel,
  loading = false,
  currentUserRole = 'CASHIER',
}) => {
  const isEdit = !!initialData;
  const [showPassword, setShowPassword] = useState(!isEdit);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: initialData || {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'CASHIER',
      branchId: '',
    },
  });

  const selectedRole = watch('role');

  const onFormSubmit = (data) => {
    const formData = {
      ...data,
      ...(isEdit && !showPassword && { password: undefined }), // Don't send password if not changing
    };
    onSubmit(formData);
  };

  // Can only assign roles equal or below current user's role
  const getAvailableRoles = () => {
    const roleHierarchy = {
      ADMIN: ['ADMIN', 'MANAGER', 'CASHIER', 'STOCK_MANAGER'],
      MANAGER: ['CASHIER', 'STOCK_MANAGER'],
      CASHIER: [],
      STOCK_MANAGER: [],
    };
    return roleHierarchy[currentUserRole] || [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <Alert variant="danger">
          Please fix the validation errors below
        </Alert>
      )}

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
            error={errors.name?.message}
            placeholder="John Doe"
          />

          <Input
            label="Phone"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="+972-50-000-0000"
          />
        </div>
      </div>

      {/* Account Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            required
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email format',
              },
            })}
            error={errors.email?.message}
            placeholder="john@example.com"
          />

          {(showPassword || !isEdit) && (
            <Input
              label="Password"
              type="password"
              required={!isEdit}
              {...register('password', {
                required: !isEdit ? 'Password is required' : false,
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                  message: 'Password must contain uppercase, lowercase, and number',
                },
              })}
              error={errors.password?.message}
              placeholder="••••••••"
            />
          )}

          {isEdit && !showPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPassword(true)}
                className="w-full"
              >
                Change Password
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Role & Branch */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Role & Assignment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-danger-600">*</span>
            </label>
            <RoleSelector
              selectedRole={selectedRole}
              onChange={(role) => setValue('role', role)}
              availableRoles={availableRoles}
              error={errors.role?.message}
            />
          </div>

          <Select
            label="Branch"
            {...register('branchId')}
            error={errors.branchId?.message}
            options={[
              { value: '', label: 'No Branch Assigned' },
              ...branches.map(b => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            icon={X}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          icon={Save}
          loading={loading}
          disabled={loading}
        >
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
