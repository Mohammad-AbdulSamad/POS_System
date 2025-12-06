// =====================================
// src/pages/users/EditUserPage.jsx
// =====================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import UserForm from '../../components/users/UserForm';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody } from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { useBranches } from '../../hooks/useBranches';
import { ArrowLeft, KeyRound } from 'lucide-react';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  
  const { user: currentUser } = useAuth();
  const { 
    fetchUserById, 
    updateUser, 
    resetPassword, 
    isLoading 
  } = useUsers({ autoFetch: false });
  const { branches } = useBranches({ autoFetch: true });

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(action === 'reset-password');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      setLoadingUser(true);
      try {
        const data = await fetchUserById(id);
        setUser(data);
      } catch (error) {
        console.error('Failed to load user:', error);
        navigate('/users');
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, [id, fetchUserById, navigate]);

  const handleSubmit = async (userData) => {
    try {
      await updateUser(id, userData);
      navigate('/users');
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    try {
      await resetPassword(id, newPassword);
      setShowResetPassword(false);
      setNewPassword('');
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  if (loadingUser) {
    return (
      <MainLayout
        currentPath="/users"
        user={{ name: currentUser?.name, role: currentUser?.role, avatar: currentUser?.name?.substring(0, 2) }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout
        currentPath="/users"
        user={{ name: currentUser?.name, role: currentUser?.role, avatar: currentUser?.name?.substring(0, 2) }}
      >
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/users')}
          >
            Back to Users
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      currentPath="/users"
      user={{ name: currentUser?.name, role: currentUser?.role, avatar: currentUser?.name?.substring(0, 2) }}
    >
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Users', href: '/users' },
            { label: user.name },
            { label: 'Edit' },
          ]}
        />

        <PageHeader
          title={`Edit ${user.name}`}
          description="Update user information and permissions"
          backButton={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/users')}
            >
              Back to Users
            </Button>
          }
          actions={
            <Button
              variant="warning"
              icon={KeyRound}
              onClick={() => setShowResetPassword(!showResetPassword)}
            >
              {showResetPassword ? 'Hide' : 'Reset Password'}
            </Button>
          }
        />

        {showResetPassword && (
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reset Password
              </h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
                <Button
                  variant="warning"
                  onClick={handleResetPassword}
                  loading={isLoading}
                  disabled={!newPassword || newPassword.length < 8}
                >
                  Reset Password
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <UserForm
              initialData={user}
              branches={branches}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/users')}
              loading={isLoading}
              currentUserRole={currentUser?.role}
            />
          </CardBody>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EditUserPage;