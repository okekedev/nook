import React from 'react';

export const AuthContext = React.createContext({
  signIn: () => {},
  signOut: () => {},
  userToken: null,
  userRole: null,
  isLoading: true,
});