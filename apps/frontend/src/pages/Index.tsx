import { Navigate } from 'react-router-dom';

const Index = () => {
  return <Navigate to="/api/v1/signin" replace />;
};

export default Index;
