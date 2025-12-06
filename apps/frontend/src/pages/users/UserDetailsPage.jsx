// src/pages/users/UserDetailsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  ArrowLeft, 
  Edit, 
  KeyRound, 
  Trash2,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  TrendingUp,
  DollarSign,
  Receipt
} from 'lucide-react';

const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { 
    fetchUserById, 
    getUserStats,
    isLoading 
  } = useUsers({ autoFetch: false });

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      setLoadingUser(true);
      try {
        const [userData, userStats] = await Promise.all([
          fetchUserById(id),
          getUserStats(id)
        ]);
        setUser(userData);
        setStats(userStats);
      } catch (error) {
        console.error('Failed to load user:', error);
        navigate('/users');
      } finally {
        setLoadingUser(false);
      }
    };

    loadUserData();
  }, [id, fetchUserById, getUserStats, navigate]);

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'MANAGER': return 'primary';
      case 'CASHIER': return 'success';
      case 'STOCK_MANAGER': return 'warning';
      default: return 'gray';
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
          ]}
        />

        <PageHeader
          title={user.name}
          description={user.email}
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={KeyRound}
                onClick={() => navigate(`/users/${id}/edit?action=reset-password`)}
              >
                Reset Password
              </Button>
              <Button
                variant="outline"
                icon={Edit}
                onClick={() => navigate(`/users/${id}/edit`)}
              >
                Edit
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <Card className="lg:col-span-1">
            <CardBody>
              <div className="text-center mb-6">
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <div className="mt-2">
                  <Badge variant={getRoleBadgeVariant(user.role)} size="lg">
                    {user.role?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-5 w-5" />
                  <span className="text-sm">{user.email}</span>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="h-5 w-5" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}

                {user.branch && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building className="h-5 w-5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.branch.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.branch.address}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-600 pt-4 border-t">
                  <Calendar className="h-5 w-5" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Joined</div>
                    <div>{formatDateTime(user.createdAt)}</div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Statistics Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Stats */}
            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-600 rounded-lg p-3">
                          <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {stats.stats?.totalTransactions || 0}
                          </div>
                          <div className="text-sm text-gray-600">Total Transactions</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-success-600 rounded-lg p-3">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(stats.stats?.totalSalesAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Total Sales</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-warning-600 rounded-lg p-3">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(stats.stats?.averageTransaction || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Avg. Transaction</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-600 rounded-lg p-3">
                          <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {stats.stats?.todayTransactions || 0}
                          </div>
                          <div className="text-sm text-gray-600">Today's Transactions</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Detailed Stats */}
                <Card>
                  <CardBody>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Performance Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Total Sales Amount</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(stats.stats?.totalSalesAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Total Refunded</span>
                        <span className="font-semibold text-danger-600">
                          {formatCurrency(stats.stats?.totalRefunded || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Average Transaction</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(stats.stats?.averageTransaction || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Today's Transactions</span>
                        <span className="font-semibold text-gray-900">
                          {stats.stats?.todayTransactions || 0}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserDetailsPage;