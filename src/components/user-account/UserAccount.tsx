import UserCount from '../user-count/UserCount';

interface UserAccountProps {
  isAuthenticated: boolean;
}

const UserAccount = ({ isAuthenticated }: UserAccountProps) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <UserCount isAuthenticated={isAuthenticated} compact={false} />
      </div>
    </div>
  );
};

export default UserAccount;

