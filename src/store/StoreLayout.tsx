import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { MiniCart } from './components/MiniCart';
import { SHOW_NEW_STORE } from '../config/features';

export const StoreLayout: React.FC = () => {
  if (!SHOW_NEW_STORE) {
    return <Navigate to="/" replace />;
  }

  return (
    <CartProvider>
      <Outlet />
      <MiniCart />
    </CartProvider>
  );
};

export default StoreLayout;
